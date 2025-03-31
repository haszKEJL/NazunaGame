console.log("--- ui.js script started execution ---");

// Import necessary functions from player.js
import { player, spendStatPoint, equipItem, upgradeInventoryItem, savePlayerData } from './player.js'; // Added savePlayerData

// --- Get DOM Elements ---
const uiContainer = document.getElementById('uiContainer');
const gameContainer = document.querySelector('.game-container'); // The parent of canvas and uiContainer
const statModal = document.getElementById('statModal');
const modalPointsRemaining = document.getElementById('modalPointsRemaining');
const modalStatStr = document.getElementById('modalStatStr');
const modalStatDex = document.getElementById('modalStatDex');
const modalStatCon = document.getElementById('modalStatCon');
const modalStatInt = document.getElementById('modalStatInt');
const modalStatAgi = document.getElementById('modalStatAgi');
const modalContent = statModal ? statModal.querySelector('.modal-content') : null;
const closeModalBtn = document.getElementById('closeStatModalBtn');
// Dialogue Box Elements
const dialogueBox = document.getElementById('dialogueBox');
const dialogueSpeaker = document.getElementById('dialogueSpeaker');
const dialogueText = document.getElementById('dialogueText');
// Inventory Screen Elements
const inventoryScreen = document.getElementById('inventoryScreen');
const equipSlotWeapon = document.getElementById('equipSlotWeapon');
const equipSlotArmor = document.getElementById('equipSlotArmor');
const inventoryGrid = document.getElementById('inventoryGrid');
const closeInventoryBtn = document.getElementById('closeInventoryBtn');
// Item Details Elements
const selectedItemName = document.getElementById('selectedItemName');
const selectedItemStats = document.getElementById('selectedItemStats');
const selectedItemUpgradeInfo = document.getElementById('selectedItemUpgradeInfo');
const upgradeItemBtn = document.getElementById('upgradeItemBtn');
// Authentication Form Elements
const authForms = document.getElementById('authForms'); // The container for both forms
const registerForm = document.getElementById('registerForm');
const loginForm = document.getElementById('loginForm');
const registerBtn = document.getElementById('registerBtn');
const loginBtn = document.getElementById('loginBtn');
const showLoginLink = document.getElementById('showLoginLink');
const showRegisterLink = document.getElementById('showRegisterLink');
const registerMessage = document.getElementById('registerMessage');
const loginMessage = document.getElementById('loginMessage');

// --- State for UI ---
let selectedInventoryIndex = null; // Track selected item index

// Check for essential elements
if (!uiContainer || !gameContainer || !statModal || !modalContent || !closeModalBtn || !dialogueBox || !dialogueSpeaker || !dialogueText || !inventoryScreen || !equipSlotWeapon || !equipSlotArmor || !inventoryGrid || !closeInventoryBtn || !selectedItemName || !selectedItemStats || !selectedItemUpgradeInfo || !upgradeItemBtn || !authForms || !registerForm || !loginForm || !registerBtn || !loginBtn || !showLoginLink || !showRegisterLink || !registerMessage || !loginMessage) {
    console.error("CRITICAL: One or more essential UI elements are missing from index.html!");
}

// --- UI Visibility Functions ---
function showGameUI() {
    if (!gameContainer) return;
    gameContainer.style.display = 'flex'; // Show the game container
    authForms.style.display = 'none'; // Hide auth forms
}

function showAuthForms() {
    if (!gameContainer) return;
    gameContainer.style.display = 'none'; // Hide the game container
    authForms.style.display = 'block'; // Show auth forms
}

// --- Dialogue Control ---
export function showDialogue(speakerName, text) {
    if (!dialogueBox || !dialogueSpeaker || !dialogueText) return;
    console.log(`UI: Showing dialogue - Speaker: ${speakerName}, Text: ${text}`);
    dialogueSpeaker.textContent = speakerName + ":";
    dialogueText.textContent = text;
    dialogueBox.style.display = 'block';
}

export function hideDialogue() {
    if (!dialogueBox) return;
    console.log("UI: Hiding dialogue box.");
    dialogueBox.style.display = 'none';
    dialogueSpeaker.textContent = '';
    dialogueText.textContent = '';
}

export function updateDialogueContent(text) {
    if (!dialogueText || !dialogueBox || dialogueBox.style.display === 'none') return;
    console.log(`UI: Updating dialogue text - Text: ${text}`);
    dialogueText.textContent = text;
}

// --- Inventory Control ---
export function showInventory() {
    if (!inventoryScreen) return;
    console.log("UI: Showing Inventory Screen.");
    updateInventoryUI(); // Populate before showing
    inventoryScreen.style.display = 'flex'; // Use flex as defined in CSS
}

export function hideInventory() {
    if (!inventoryScreen) return;
    console.log("UI: Hiding Inventory Screen.");
    inventoryScreen.style.display = 'none';
}

// Function to update the inventory screen display
function updateInventoryUI() {
    if (!equipSlotWeapon || !equipSlotArmor || !inventoryGrid) return;

    // Clear previous content
    equipSlotWeapon.innerHTML = '';
    equipSlotArmor.innerHTML = '';
    inventoryGrid.innerHTML = '';
    selectedInventoryIndex = null; // Reset selection on UI update
    updateSelectedItemDetails(null); // Clear details pane

    // Populate Equipment Slots
    if (player.equipment.weapon) {
        const item = player.equipment.weapon;
        const itemDiv = createItemDiv(item, 'weapon'); // Pass slot type
        equipSlotWeapon.appendChild(itemDiv);
    }
    if (player.equipment.armor) {
        const item = player.equipment.armor;
        const itemDiv = createItemDiv(item, 'armor'); // Pass slot type
        equipSlotArmor.appendChild(itemDiv);
    }

    // Populate Inventory Grid
    player.inventory.forEach((item, index) => {
        const itemDiv = createItemDiv(item, index); // Pass inventory index
        inventoryGrid.appendChild(itemDiv);
    });
}

// Function to update the item details pane
function updateSelectedItemDetails(itemIndex) {
     if (!selectedItemName || !selectedItemStats || !selectedItemUpgradeInfo || !upgradeItemBtn) return;

     // Clear previous selection highlight
     document.querySelectorAll('.inventory-item.selected').forEach(el => el.classList.remove('selected'));

     if (itemIndex === null || itemIndex < 0 || itemIndex >= player.inventory.length) {
         selectedInventoryIndex = null;
         selectedItemName.textContent = 'Select an Item';
         selectedItemStats.innerHTML = '';
         selectedItemUpgradeInfo.innerHTML = '';
         upgradeItemBtn.disabled = true;
         return;
     }

     selectedInventoryIndex = itemIndex;
     const item = player.inventory[itemIndex];

     // Highlight selected item
     const selectedDiv = inventoryGrid.querySelector(`.inventory-item[data-inventory-index="${itemIndex}"]`);
     if (selectedDiv) {
         selectedDiv.classList.add('selected');
     }

     selectedItemName.textContent = `${item.name} ${item.upgradeLevel > 0 ? `+${item.upgradeLevel}` : ''}`;

     // Display stats
     let statsHTML = '';
     if (item.stats) {
         for (const stat in item.stats) {
             statsHTML += `<span>${stat.toUpperCase()}: ${item.stats[stat]}</span><br>`;
         }
     } else {
         statsHTML = '<span>No Stats</span>';
     }
     selectedItemStats.innerHTML = statsHTML;

     // Display upgrade info
     let upgradeHTML = '';
     let canUpgrade = false;
     if (typeof item.upgradeLevel !== 'undefined' && item.maxUpgradeLevel) {
         if (item.upgradeLevel < item.maxUpgradeLevel) {
             const cost = calculateUpgradeCost(item); // Use helper from player.js? No, calculate here or get from player.js
             // Re-implement cost calculation here for UI display (or import if needed)
             const displayCost = Math.floor((item.baseValue || 0) * Math.pow(2, item.upgradeLevel));
             upgradeHTML = `Level: ${item.upgradeLevel}/${item.maxUpgradeLevel}<br>Upgrade Cost: ${displayCost} Gold`;
             canUpgrade = player.gold >= displayCost;
         } else {
             upgradeHTML = `Level: ${item.upgradeLevel}/${item.maxUpgradeLevel} (MAX)`;
         }
     } else {
         upgradeHTML = '<span>Not Upgradable</span>';
     }
     selectedItemUpgradeInfo.innerHTML = upgradeHTML;
     upgradeItemBtn.disabled = !canUpgrade;

}

// Helper function to calculate upgrade cost (duplicate for UI, consider refactoring later)
function calculateUpgradeCost(item) {
    if (!item || typeof item.upgradeLevel === 'undefined' || !item.baseValue) {
        return Infinity;
    }
    return Math.floor(item.baseValue * Math.pow(2, item.upgradeLevel));
}

// Helper function to create an item div (used for both equip and inventory)
function createItemDiv(item, identifier) {
    const itemDiv = document.createElement('div');
    itemDiv.classList.add('inventory-item'); // Use same base class for styling
    // Add specific dataset based on whether it's equipped or inventory index
    if (typeof identifier === 'string') { // It's an equipment slot name
        itemDiv.dataset.equipSlot = identifier;
        itemDiv.classList.add('equipped-item'); // Maybe different style later
    } else { // It's an inventory index
        itemDiv.dataset.inventoryIndex = identifier;
    }

    itemDiv.textContent = item.name; // Placeholder: Use name
    // TODO: Add image/icon later

    // Add quantity display for stackable items
    if (item.stackable && item.quantity > 1) {
        const quantitySpan = document.createElement('span');
        quantitySpan.classList.add('item-quantity');
        quantitySpan.textContent = item.quantity;
        itemDiv.appendChild(quantitySpan);
    }
    return itemDiv;
}


// --- Modal Control ---
export function openStatModal() {
    if (!statModal) return;
    updateModalStats(); // Update display when opening
    statModal.style.display = 'block';
    console.log("Stat modal opened.");
    // TODO: Pause game loop? (Requires changes in game.js)
}

function closeStatModal() {
    if (!statModal) return;
    statModal.style.display = 'none';
    console.log("Stat modal closed.");
    updateUI(); // Refresh main UI in case points were spent
    // TODO: Resume game loop? (Requires changes in game.js)
}

function updateModalStats() {
    // Check for core elements first
    if (!modalPointsRemaining || !modalStatStr || !modalStatDex || !modalContent) return;

    modalPointsRemaining.textContent = player.statPoints;
    modalStatStr.textContent = player.strength;
    modalStatDex.textContent = player.dexterity;
    // Update new stats if elements exist
    if (modalStatCon) modalStatCon.textContent = player.constitution;
    if (modalStatInt) modalStatInt.textContent = player.intelligence;
    if (modalStatAgi) modalStatAgi.textContent = player.agility;


    // Disable buttons if no points left
    const buttons = modalContent.querySelectorAll('.modal-stat-button');
    buttons.forEach(btn => {
        btn.disabled = player.statPoints <= 0;
    });
}

// --- Main UI Update ---
export function updateUI() {
    if (!uiContainer) return;

    const potion = player.inventory.find(i => i.name === 'Health Potion');
    const potionCount = potion ? potion.quantity : 0;
    const weaponName = player.equipment.weapon ? player.equipment.weapon.name : 'None';
    const armorName = player.equipment.armor ? player.equipment.armor.name : 'None';

    // Display stat points, but no button here anymore
    const statPointsHTML = `<p>Stat Points: ${player.statPoints} ${player.statPoints > 0 ? '(Press P to allocate)' : ''}</p>`;

    const uiHTML = `
        <p>HP: ${player.hp} / ${player.maxHp}</p>
        <p>Level: ${player.level}</p>
        <p>XP: ${player.xp} / ${player.xpToNextLevel}</p>
        ${statPointsHTML}
        <hr>
        <p>HP: ${player.hp} / ${player.maxHp}</p> <!-- Duplicated HP, remove one -->
        <p>Attack: ${player.attack}</p>
        <p>Defense: ${player.defense}</p>
        <hr>
        <p>STR: ${player.strength}</p>
        <p>DEX: ${player.dexterity}</p>
        <p>CON: ${player.constitution}</p>
        <p>INT: ${player.intelligence}</p>
        <p>AGI: ${player.agility}</p>
        <hr>
        <p>Gold: ${player.gold}</p> <!-- Display Gold -->
        <hr>
        <p>Potions (H): ${potionCount}</p>
        <p>Weapon: ${weaponName}</p>
        <p>Armor: ${armorName}</p>
        <p>(E to Equip)</p>
        <p>(Tab for Inv)</p> <!-- Added hint for inventory -->
        <button id="logoutBtn">Logout</button> <!-- Logout Button -->
    `;

    uiContainer.innerHTML = uiHTML;

    // Add event listener for logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        // Check if listener already exists to prevent duplicates if updateUI is called often
        if (!logoutBtn.dataset.listenerAttached) {
            logoutBtn.addEventListener('click', async () => { // Make listener async
                console.log("Logout button clicked. Attempting to save data first...");
                try {
                    await savePlayerData(); // Wait for save to complete
                    console.log("Data save attempt finished. Proceeding with logout.");
                } catch (error) {
                    console.error("Error during pre-logout save:", error);
                    // Decide if logout should proceed even if save fails? For now, yes.
                } finally {
                    // Clear local storage and reload regardless of save success/failure
                    localStorage.removeItem('token');
                    localStorage.removeItem('username');
                    window.location.reload(); // Reload to trigger auth check
                }
            });
            logoutBtn.dataset.listenerAttached = 'true'; // Mark as attached
        }
    }

    // No longer need to attach listener for the open button here
}

// --- Event Listeners ---
function setupListeners() {
    // -- Modal Listeners --
    if (modalContent && closeModalBtn) {
        modalContent.addEventListener('click', (event) => {
            const button = event.target.closest('button.modal-stat-button');
            if (button) {
                const statToIncrease = button.dataset.stat;
                console.log("Modal stat button clicked:", statToIncrease);
                const validStats = ['strength', 'dexterity', 'constitution', 'intelligence', 'agility'];
                if (validStats.includes(statToIncrease)) {
                    const success = spendStatPoint(statToIncrease);
                    if (success) {
                        updateModalStats();
                    } else {
                        console.log("Failed to spend point (likely 0 points left).");
                    }
                }
            }
        });
        closeModalBtn.addEventListener('click', closeStatModal);
        console.log("Modal listeners attached.");
    } else {
         console.error("Cannot setup modal listeners - elements missing.");
    }

    // -- Inventory Listeners --
    if (inventoryScreen && closeInventoryBtn && inventoryGrid && equipSlotWeapon && equipSlotArmor) {
        // Close button listener (still primarily handled by Tab/Escape in game.js)
        closeInventoryBtn.addEventListener('click', () => {
            console.log("Close Inventory button clicked (should be handled by Tab/Escape in game.js)");
            // If direct button closure is needed, game.js needs to expose toggleInventoryScreen
            // For now, we rely on the keyup listener in game.js
            // hideInventory(); // This would hide UI but not change game state
        });

        // Inventory item click listener (delegation)
        inventoryGrid.addEventListener('click', (event) => {
            const itemDiv = event.target.closest('.inventory-item');
            if (itemDiv && itemDiv.dataset.inventoryIndex !== undefined) {
                const index = parseInt(itemDiv.dataset.inventoryIndex, 10);
                console.log(`Clicked inventory item at index: ${index}`);
                updateSelectedItemDetails(index); // Show details on click
                // Equip logic could be moved to a double-click or context menu later
                // equipItem(index); // Don't equip on single click anymore
            } else {
                 // Clicked outside an item, deselect
                 updateSelectedItemDetails(null);
            }
        });

         // Equipment slot click listener (delegation on parent) - For unequipping later
         const equipSlotsContainer = equipSlotWeapon?.closest('.equip-slots'); // Use optional chaining
         if (equipSlotsContainer) {
             equipSlotsContainer.addEventListener('click', (event) => {
                 const itemDiv = event.target.closest('.inventory-item.equipped-item'); // Click the item within the slot
                 if (itemDiv && itemDiv.dataset.equipSlot) {
                     const slotName = itemDiv.dataset.equipSlot;
                     console.log(`Clicked equipped item in slot: ${slotName}`);
                     // TODO: Implement unequipItem(slotName) in player.js and call it
                     // unequipItem(slotName); updateInventoryUI(); updateUI();
                     console.log("Unequip functionality not yet implemented.");
                     updateSelectedItemDetails(null); // Deselect after clicking equipped item for now
                 }
             });
         }

         // Upgrade button listener
         if (upgradeItemBtn) {
             upgradeItemBtn.addEventListener('click', () => {
                 if (selectedInventoryIndex !== null && !upgradeItemBtn.disabled) {
                     console.log(`Attempting to upgrade item at index: ${selectedInventoryIndex}`);
                     const success = upgradeInventoryItem(selectedInventoryIndex); // Call function from player.js
                     if (success) {
                         // Refresh UI after successful upgrade
                         updateInventoryUI(); // This will re-render grid and clear selection
                         updateUI(); // Update main panel (gold)
                         // Re-select the item to show updated details
                         updateSelectedItemDetails(selectedInventoryIndex);
                     } else {
                         // Update details to potentially show updated cost/gold or error message
                         updateSelectedItemDetails(selectedInventoryIndex);
                         // Maybe show a temporary message?
                     }
                 }
             });
         }

        console.log("Inventory listeners attached.");
    } else {
         console.error("Cannot setup inventory listeners - elements missing.");
    }
} // End of setupListeners function

// Setup listeners once the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOMContentLoaded fired. Setting up listeners.");
    setupListeners(); // Call the combined setup function
    // REMOVED checkAuthState() call - auth.js handles initial UI state.
    // Initial UI render (might show default values briefly before auth completes)
    updateUI();
});
