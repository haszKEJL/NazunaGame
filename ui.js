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
const equipSlotHelmet = document.getElementById('equipSlotHelmet');
const equipSlotNecklace = document.getElementById('equipSlotNecklace');
const equipSlotTalisman = document.getElementById('equipSlotTalisman');
const equipSlotWeapon = document.getElementById('equipSlotWeapon');
const equipSlotArmor = document.getElementById('equipSlotArmor');
const equipSlotShield = document.getElementById('equipSlotShield');
const equipSlotRing1 = document.getElementById('equipSlotRing1');
const equipSlotRing2 = document.getElementById('equipSlotRing2');
const equipSlotBoots = document.getElementById('equipSlotBoots');
const inventoryGrid = document.getElementById('inventoryGrid');
const closeInventoryBtn = document.getElementById('closeInventoryBtn');
// Item Details Elements
const selectedItemName = document.getElementById('selectedItemName');
const selectedItemStats = document.getElementById('selectedItemStats');
const selectedItemUpgradeInfo = document.getElementById('selectedItemUpgradeInfo');
const upgradeItemBtn = document.getElementById('upgradeItemBtn');
const equipItemBtn = document.getElementById('equipItemBtn'); // Added Equip button
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

// Check for essential elements (add new slots and buttons)
// TODO: Add checks for ALL new equipSlot IDs from HTML
if (!uiContainer || !gameContainer || !statModal || !modalContent || !closeModalBtn || !dialogueBox || !dialogueSpeaker || !dialogueText || !inventoryScreen || !inventoryGrid || !closeInventoryBtn || !selectedItemName || !selectedItemStats || !selectedItemUpgradeInfo || !upgradeItemBtn || !equipItemBtn || !authForms || !registerForm || !loginForm || !registerBtn || !loginBtn || !showLoginLink || !showRegisterLink || !registerMessage || !loginMessage) {
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
    // Get all new slot elements (add more as needed based on HTML)
    const equipSlots = {
        special1: document.getElementById('equipSlotSpecial1'),
        head: document.getElementById('equipSlotHead'),
        portrait: document.getElementById('equipSlotPortrait'),
        body: document.getElementById('equipSlotBody'),
        weapon: document.getElementById('equipSlotWeapon'),
        armor: document.getElementById('equipSlotArmor'),
        ranged: document.getElementById('equipSlotRanged'),
        mount: document.getElementById('equipSlotMount'),
        belt: document.getElementById('equipSlotBelt'),
        special2: document.getElementById('equipSlotSpecial2'),
        legs: document.getElementById('equipSlotLegs'),
        feet: document.getElementById('equipSlotFeet')
        // Add other slots like necklace, rings, talisman if they exist in player.equipment
    };

    if (!inventoryGrid) return; // Basic check

    // Clear previous content for all slots
    for (const slotName in equipSlots) {
        const slotElement = equipSlots[slotName];
        if (slotElement) {
            slotElement.innerHTML = '';
        } else {
            // console.warn(`UI: Equip slot element '${slotName}' not found.`); // Reduce noise
        }
    }
    inventoryGrid.innerHTML = '';
    selectedInventoryIndex = null; // Reset selection on UI update
    updateSelectedItemDetails(null); // Clear details pane

    // Populate Equipment Slots (Iterate through player equipment)
    console.log("UI: Populating equipment slots. Player equipment:", JSON.stringify(player.equipment));
    for (const slotName in player.equipment) {
        const item = player.equipment[slotName];
        if (item) {
            const itemDiv = createItemDiv(item, slotName); // Pass slot name
            const slotElement = equipSlots[slotName]; // Use the fetched element
            if (slotElement) {
                slotElement.appendChild(itemDiv);
            } else {
                console.warn(`UI: Could not find slot element for '${slotName}' in equipSlots map.`);
            }
        }
    }

    // Populate Inventory Grid
    console.log("UI: Populating inventory grid. Player inventory:", JSON.stringify(player.inventory)); // Log inventory before loop
    if (!player.inventory || !Array.isArray(player.inventory)) {
        console.error("UI: player.inventory is not a valid array!", player.inventory);
        return; // Stop if inventory is invalid
    }
    player.inventory.forEach((item, index) => {
        const itemDiv = createItemDiv(item, index); // Pass inventory index
        inventoryGrid.appendChild(itemDiv);
        console.log(`UI: Added item '${item.name}' to inventory grid at index ${index}`);
    });
}

// Function to update the item details pane
function updateSelectedItemDetails(itemIndex) {
     // Add equipItemBtn check
     if (!selectedItemName || !selectedItemStats || !selectedItemUpgradeInfo || !upgradeItemBtn || !equipItemBtn) return;

     // Clear previous selection highlight
     document.querySelectorAll('.inventory-item.selected').forEach(el => el.classList.remove('selected'));

     if (itemIndex === null || itemIndex < 0 || itemIndex >= player.inventory.length) {
         selectedInventoryIndex = null;
         selectedItemName.textContent = 'Select an Item';
         selectedItemStats.innerHTML = '';
         selectedItemUpgradeInfo.innerHTML = '';
         upgradeItemBtn.disabled = true;
         equipItemBtn.disabled = true; // Disable equip button too
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
     // Check if item is upgradable (has level and base value)
     if (typeof item.upgradeLevel !== 'undefined' && item.baseValue) {
         const cost = calculateUpgradeCost(item);
         const displayCost = Math.floor((item.baseValue || 0) * Math.pow(2, item.upgradeLevel));
         // Display current level and cost, no max level shown
         upgradeHTML = `Level: ${item.upgradeLevel}<br>Upgrade Cost: ${displayCost} Gold`;
         canUpgrade = player.gold >= displayCost;
     } else {
         // Item doesn't have upgradeLevel or baseValue defined
         upgradeHTML = '<span>Not Upgradable</span>';
     }
     selectedItemUpgradeInfo.innerHTML = upgradeHTML;
     upgradeItemBtn.disabled = !canUpgrade;

     // Enable/disable Equip button based on item type
     equipItemBtn.disabled = !item || !item.equipSlot; // Disable if no item or item not equippable

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
    console.log(`UI: Creating item div for:`, item, `Identifier:`, identifier); // Add detailed log
    const itemDiv = document.createElement('div');
    itemDiv.classList.add('inventory-item'); // Use same base class for styling
    // Add specific dataset based on whether it's equipped or inventory index
    if (typeof identifier === 'string') { // It's an equipment slot name
        itemDiv.dataset.equipSlot = identifier;
        itemDiv.classList.add('equipped-item'); // Maybe different style later
    } else { // It's an inventory index
        itemDiv.dataset.inventoryIndex = identifier;
    }

    if (!item || !item.name) { // Check if item or item.name is missing
        console.error("UI: Invalid item data passed to createItemDiv:", item);
        itemDiv.textContent = 'Error'; // Display error if item is invalid
        return itemDiv;
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
    // Dynamically build equipment display string
    let equipmentHTML = '';
    for (const slot in player.equipment) {
        const item = player.equipment[slot];
        const itemName = item ? item.name : 'None';
        // Capitalize slot name for display
        const slotDisplayName = slot.charAt(0).toUpperCase() + slot.slice(1);
        equipmentHTML += `<p>${slotDisplayName}: ${itemName}</p>`;
    }

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
        ${equipmentHTML} <!-- Display all equipment -->
        <!-- <p>(E to Equip)</p> REMOVED -->
        <p>(Tab for Inv)</p> <!-- Added hint for inventory -->
        <button id="logoutBtn">Logout</button> <!-- Logout Button -->
    `;

    uiContainer.innerHTML = uiHTML;

    // Re-attach event listener for logout button every time UI updates
    // This ensures it's always present after innerHTML overwrite
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
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
                console.log("Clearing local storage and reloading...");
                localStorage.removeItem('token');
                localStorage.removeItem('username');
                window.location.reload(); // Reload to trigger auth check
            }
        });
    } else {
        console.warn("Logout button not found after UI update.");
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

         // Equip button listener
         if (equipItemBtn) {
             equipItemBtn.addEventListener('click', () => {
                 if (selectedInventoryIndex !== null && !equipItemBtn.disabled) {
                     console.log(`UI: Equip button clicked for index: ${selectedInventoryIndex}`);
                     const success = equipItem(selectedInventoryIndex); // Call function from player.js
                     if (success) {
                         // Refresh UI after successful equip
                         updateInventoryUI(); // This will re-render grid/slots and clear selection
                         updateUI(); // Update main panel (stats, equip display)
                         // No need to re-select, details pane is cleared by updateInventoryUI
                     } else {
                         // Maybe show an error message?
                         console.log("UI: Equip failed (likely incompatible slot or other issue).");
                     }
                 }
             });
         }

         // Upgrade button listener
         if (upgradeItemBtn) {
             upgradeItemBtn.addEventListener('click', () => {
                 if (selectedInventoryIndex !== null && !upgradeItemBtn.disabled) {
                     console.log(`UI: Attempting to upgrade item at index: ${selectedInventoryIndex}`);
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
         console.error("Cannot setup inventory listeners - elements missing (check equip/upgrade buttons).");
    }
} // End of setupListeners function

// Setup listeners once the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOMContentLoaded fired. Setting up listeners.");
    setupListeners(); // Call the combined setup function
    // REMOVED checkAuthState() call - auth.js handles initial UI state.
    // Initial UI render (might show default values briefly before auth completes)
    updateUI();
    // Ensure inventory is hidden initially (CSS should handle this, but belt-and-suspenders)
    hideInventory();
});
