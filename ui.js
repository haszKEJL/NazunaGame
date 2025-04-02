console.log("--- ui.js script started execution ---");

// Import necessary functions from player.js
import { player, spendStatPoint, equipItem, upgradeInventoryItem, savePlayerData } from './player.js'; // Added savePlayerData

// --- Get DOM Elements (Updated for new structure) ---
// Main UI Panels
const playerStatsContent = document.getElementById('uiStatsContent');
const actionLogContent = document.getElementById('uiLogContent');
// Overlays & Modals
const statModal = document.getElementById('statModal');
const dialogueBox = document.getElementById('dialogueBox');
const inventoryScreen = document.getElementById('inventoryScreen');
const authForms = document.getElementById('authForms'); // The container for both forms
// Stat Modal Internals
const modalPointsRemaining = document.getElementById('modalPointsRemaining');
const modalStatStr = document.getElementById('modalStatStr');
const modalStatDex = document.getElementById('modalStatDex');
const modalStatCon = document.getElementById('modalStatCon');
const modalStatInt = document.getElementById('modalStatInt');
const modalStatAgi = document.getElementById('modalStatAgi');
const statModalContent = statModal ? statModal.querySelector('.modal-content') : null; // Get content div for button delegation
const closeStatModalBtn = document.getElementById('closeStatModalBtn'); // Now a span
// Dialogue Box Internals
const dialogueSpeaker = document.getElementById('dialogueSpeaker');
const dialogueText = document.getElementById('dialogueText');
// Inventory Screen Internals
const inventoryGrid = document.getElementById('inventoryGrid');
const closeInventoryBtn = document.getElementById('closeInventoryBtn');
// Equipment Slots (Simplified)
const equipSlots = {
    head: document.getElementById('equipSlotHead'),
    weapon: document.getElementById('equipSlotWeapon'),
    armor: document.getElementById('equipSlotArmor'),
    shield: document.getElementById('equipSlotShield'),
    boots: document.getElementById('equipSlotBoots'),
    necklace: document.getElementById('equipSlotNecklace'), // Keep necklace ID
    ring1: document.getElementById('equipSlotRing1'),
    ring2: document.getElementById('equipSlotRing2'),
    talisman: document.getElementById('equipSlotTalisman') // Add talisman ID
};
// Item Details Elements
const selectedItemName = document.getElementById('selectedItemName');
const selectedItemStats = document.getElementById('selectedItemStats');
const selectedItemUpgradeInfo = document.getElementById('selectedItemUpgradeInfo');
const upgradeItemBtn = document.getElementById('upgradeItemBtn');
const equipItemBtn = document.getElementById('equipItemBtn');
// Authentication Form Elements
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

// Basic check for essential elements
if (!playerStatsContent || !actionLogContent || !statModal || !dialogueBox || !inventoryScreen || !authForms) {
    console.error("CRITICAL: One or more essential UI panel/overlay elements are missing!");
}
// Add more checks as needed

// --- UI Visibility Functions ---
// These now control the overlays
// Export functions needed by auth.js directly
export function showGameUI() { // ADDED export keyword
    // Find the game area element (assuming it exists)
    const gameArea = document.querySelector('.game-area');
    if (gameArea) {
        gameArea.style.display = 'flex'; // Or 'block', depending on layout needs
    }
    // Hide auth forms
    const authFormsContainer = document.getElementById('authForms');
    if (authFormsContainer) {
        authFormsContainer.style.display = 'none';
    }
}

export function showAuthForms() { // ADDED export keyword
    // Hide the game area
    const gameArea = document.querySelector('.game-area');
    if (gameArea) {
        gameArea.style.display = 'none';
    }
    // Show auth forms
    const authFormsContainer = document.getElementById('authForms');
    if (authFormsContainer) {
        authFormsContainer.style.display = 'flex'; // Use flex to center the forms container
    }
}

function showOverlay(element) {
    if (element) {
        element.style.display = 'flex'; // Use flex for centering overlays
    }
}
function hideOverlay(element) {
    if (element) {
        element.style.display = 'none';
    }
}

// --- Dialogue Control ---
export function showDialogue(speakerName, text) {
    if (!dialogueBox || !dialogueSpeaker || !dialogueText) return;
    console.log(`UI: Showing dialogue - Speaker: ${speakerName}, Text: ${text}`);
    dialogueSpeaker.textContent = speakerName + ":";
    dialogueText.textContent = text;
    showOverlay(dialogueBox); // Use overlay function
}

export function hideDialogue() {
    if (!dialogueBox) return;
    console.log("UI: Hiding dialogue box.");
    hideOverlay(dialogueBox); // Use overlay function
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
    showOverlay(inventoryScreen); // Use overlay function
}

export function hideInventory() {
    if (!inventoryScreen) return;
    console.log("UI: Hiding Inventory Screen.");
    hideOverlay(inventoryScreen); // Use overlay function
}

// Function to update the inventory screen display
function updateInventoryUI() {
    // Equipment slots are already fetched into the 'equipSlots' object

    if (!inventoryGrid) return; // Basic check

    // Clear previous content for all slots
    for (const slotName in equipSlots) {
        const slotElement = equipSlots[slotName];
        if (slotElement) {
            const displayDiv = slotElement.querySelector('.item-display');
            if (displayDiv) {
                displayDiv.innerHTML = ''; // Clear only the display part
            } else {
                 slotElement.innerHTML = ''; // Fallback clear whole slot
            }
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
            const slotElement = equipSlots[slotName]; // Get the slot container
            if (slotElement) {
                 const displayDiv = slotElement.querySelector('.item-display');
                 if (displayDiv) {
                     displayDiv.appendChild(itemDiv); // Append to the display div
                 } else {
                     slotElement.appendChild(itemDiv); // Fallback append to slot
                 }
            } else {
                // console.warn(`UI: Could not find slot element for '${slotName}' in equipSlots map.`); // Reduce noise
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
        // console.log(`UI: Added item '${item.name}' to inventory grid at index ${index}`); // Reduce noise
    });
}

// Function to update the item details pane
function updateSelectedItemDetails(itemIndex) {
     if (!selectedItemName || !selectedItemStats || !selectedItemUpgradeInfo || !upgradeItemBtn || !equipItemBtn) return;

     // Clear previous selection highlight
     document.querySelectorAll('.inventory-item.selected').forEach(el => el.classList.remove('selected'));

     if (itemIndex === null || itemIndex < 0 || itemIndex >= player.inventory.length) {
         selectedInventoryIndex = null;
         selectedItemName.textContent = 'Select an Item';
         selectedItemStats.innerHTML = '';
         selectedItemUpgradeInfo.innerHTML = '';
         upgradeItemBtn.disabled = true;
         equipItemBtn.disabled = true;
         return;
     }

     selectedInventoryIndex = itemIndex;
     const item = player.inventory[itemIndex];

     // Highlight selected item in the grid
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
     // Add item type/slot info
     statsHTML += `<br><span>Type: ${item.type || 'N/A'}</span><br>`;
     if(item.slot) statsHTML += `<span>Slot: ${item.slot}</span><br>`;

     // Display Substats
     if (Array.isArray(item.substats) && item.substats.length > 0) {
         statsHTML += `<hr><span>Substats:</span><br>`;
         item.substats.forEach(sub => {
             // Format the substat display
             statsHTML += `<span>&nbsp;&nbsp;• ${sub.stat}: +${sub.value.toFixed(sub.isPercent ? 1 : 0)}${sub.isPercent ? '%' : ''}</span><br>`;
         });
     }

     selectedItemStats.innerHTML = statsHTML;

     // Display upgrade info
     let upgradeHTML = '';
     let canUpgrade = false;
     if (typeof item.upgradeLevel !== 'undefined' && item.baseValue) {
         const cost = calculateUpgradeCost(item);
         upgradeHTML = `Level: ${item.upgradeLevel}<br>Upgrade Cost: ${cost} Gold`;
         canUpgrade = player.gold >= cost;
     } else {
         upgradeHTML = '<span>Not Upgradable</span>';
     }
     selectedItemUpgradeInfo.innerHTML = upgradeHTML;
     upgradeItemBtn.disabled = !canUpgrade;

     // Enable/disable Equip button based on item type/slot
     equipItemBtn.disabled = !item || !item.slot; // Disable if no item or no slot defined

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
    // console.log(`UI: Creating item div for:`, item, `Identifier:`, identifier); // Reduce noise
    const itemDiv = document.createElement('div');
    itemDiv.classList.add('inventory-item'); // Base class

    if (!item || !item.name) {
        console.error("UI: Invalid item data passed to createItemDiv:", item);
        itemDiv.textContent = 'Error';
        return itemDiv;
    }

    // Add dataset for identification
    if (typeof identifier === 'string') { // Equipment slot name
        itemDiv.dataset.equipSlot = identifier;
        itemDiv.classList.add('equipped-item');
    } else { // Inventory index
        itemDiv.dataset.inventoryIndex = identifier;
    }

    // Add rarity class
    if (item.rarity) {
        itemDiv.classList.add(`item-${item.rarity}`);
    } else {
        itemDiv.classList.add('item-common'); // Default rarity
    }

    // Display item name (or icon later)
    const nameSpan = document.createElement('span');
    nameSpan.textContent = item.name;
    itemDiv.appendChild(nameSpan);
    // TODO: Add image element if item.icon exists

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
    showOverlay(statModal); // Use overlay function
    console.log("Stat modal opened.");
}

function closeStatModal() {
    if (!statModal) return;
    hideOverlay(statModal); // Use overlay function
    console.log("Stat modal closed.");
    updateUI(); // Refresh main UI in case points were spent
}

function updateModalStats() {
    if (!modalPointsRemaining || !modalStatStr || !modalStatDex || !statModalContent) return;

    modalPointsRemaining.textContent = player.statPoints;
    modalStatStr.textContent = player.strength;
    modalStatDex.textContent = player.dexterity;
    if (modalStatCon) modalStatCon.textContent = player.constitution;
    if (modalStatInt) modalStatInt.textContent = player.intelligence;
    if (modalStatAgi) modalStatAgi.textContent = player.agility;

    // Disable buttons if no points left
    const buttons = statModalContent.querySelectorAll('.modal-stat-button');
    buttons.forEach(btn => {
        btn.disabled = player.statPoints <= 0;
    });
}

// --- Main UI Update (Populates Panels) ---
export function updateUI() {
    if (!playerStatsContent || !actionLogContent) return; // Check if panels exist

    // --- Update Stats Panel ---
    // Generate the button HTML conditionally
    const statPointsButtonHTML = player.statPoints > 0 ? ` <button id="openStatModalBtn" class="inline-button">(P) Allocate</button>` : '';
    const statsHTML = `
        <p>HP: ${player.hp} / ${player.maxHp}</p>
        <p>Level: ${player.level} (XP: ${player.xp}/${player.xpToNextLevel})</p>
        <p>Points: ${player.statPoints}${statPointsButtonHTML}</p> <!-- Use the generated button HTML -->
        <hr>
        <p>STR: ${player.strength} | DEX: ${player.dexterity} | CON: ${player.constitution}</p>
        <p>INT: ${player.intelligence} | AGI: ${player.agility}</p>
        <hr>
        <p>Attack: ${player.attack} | Defense: ${player.defense}</p>
        <hr>
        <p>Gold: ${player.gold}</p>
        <button id="logoutBtn">Logout</button>
    `;
    playerStatsContent.innerHTML = statsHTML;

    // REMOVE listener attachments from here - they will be handled by delegation in setupListeners

    // --- Update Log Panel (Example - Needs real log data) ---
    // For now, just keep the last message or add a new one
    // In a real implementation, you'd have a log array
    // actionLogContent.innerHTML = "Game started.<br>Moved North."; // Replace with actual log
}

// --- Add to Log Function ---
export function addLogMessage(message) {
    if (!actionLogContent) return;
    const maxLogLines = 5; // Keep log concise
    const messageElement = document.createElement('p');
    messageElement.textContent = message;
    actionLogContent.appendChild(messageElement);

    // Remove oldest message if log exceeds max lines
    while (actionLogContent.children.length > maxLogLines) {
        actionLogContent.removeChild(actionLogContent.firstChild);
    }
    // Scroll to bottom
    actionLogContent.scrollTop = actionLogContent.scrollHeight;
}


// --- Logout Handler ---
async function handleLogout() {
    console.log("Logout button clicked. Attempting to save data first...");
    try {
        await savePlayerData(); // Wait for save to complete
        console.log("Data save attempt finished. Proceeding with logout.");
    } catch (error) {
        console.error("Error during pre-logout save:", error);
    } finally {
        console.log("Clearing local storage and reloading...");
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        window.location.reload(); // Reload to trigger auth check
    }
}

// --- Event Listeners ---
function setupListeners() {
    // Get static parent elements for delegation
    const statsPanel = document.getElementById('player-stats-panel');

    // -- Stats Panel Button Listeners (Delegation) --
    if (statsPanel) {
        statsPanel.addEventListener('click', (event) => {
            if (event.target.id === 'openStatModalBtn') {
                console.log("Allocate button clicked (delegated).");
                openStatModal();
            } else if (event.target.id === 'logoutBtn') {
                console.log("Logout button clicked (delegated).");
                handleLogout();
            }
        });
        console.log("Stats panel delegated listeners attached.");
    } else {
        console.error("Cannot setup Stats Panel listeners - panel element missing.");
    }


    // -- Modal Listeners --
    if (statModalContent && closeStatModalBtn) {
        // Use event delegation on the content div for stat buttons
        statModalContent.addEventListener('click', (event) => {
            const button = event.target.closest('button.modal-stat-button');
            if (button && button.dataset.stat) {
                const statToIncrease = button.dataset.stat;
                console.log("Modal stat button clicked:", statToIncrease);
                const success = spendStatPoint(statToIncrease);
                if (success) {
                    updateModalStats(); // Update modal display
                    // updateUI(); // Update main UI panel as well (optional here, happens on close)
                }
            }
        });
        // Close button listener (now a span)
        closeStatModalBtn.addEventListener('click', closeStatModal);
        console.log("Stat Modal listeners attached.");
    } else {
         console.error("Cannot setup Stat Modal listeners - elements missing.");
    }

    // -- Inventory Listeners --
    if (inventoryScreen && closeInventoryBtn && inventoryGrid && equipItemBtn && upgradeItemBtn) {
        // Close button listener
        closeInventoryBtn.addEventListener('click', hideInventory); // Direct hide on button click

        // Inventory item click listener (delegation)
        inventoryGrid.addEventListener('click', (event) => {
            const itemDiv = event.target.closest('.inventory-item');
            if (itemDiv && itemDiv.dataset.inventoryIndex !== undefined) {
                const index = parseInt(itemDiv.dataset.inventoryIndex, 10);
                updateSelectedItemDetails(index);
            } else {
                 updateSelectedItemDetails(null); // Clicked outside an item
            }
        });

         // Equip button listener
         equipItemBtn.addEventListener('click', () => {
             if (selectedInventoryIndex !== null && !equipItemBtn.disabled) {
                 console.log(`UI: Equip button clicked for index: ${selectedInventoryIndex}`);
                 const success = equipItem(selectedInventoryIndex);
                 if (success !== false) { // equipItem might not return explicit true
                     updateInventoryUI(); // Refreshes grid/slots and clears selection/details
                     updateUI(); // Update main stats panel
                 } else {
                     addLogMessage("Cannot equip this item."); // Add feedback
                     console.log("UI: Equip failed.");
                 }
             }
         });

         // Upgrade button listener
         upgradeItemBtn.addEventListener('click', () => {
             if (selectedInventoryIndex !== null && !upgradeItemBtn.disabled) {
                 const itemIndexToUpdate = selectedInventoryIndex; // Store index before potential changes
                 console.log(`UI: Attempting to upgrade item at index: ${itemIndexToUpdate}`);
                 const success = upgradeInventoryItem(itemIndexToUpdate);

                 if (success) {
                     addLogMessage("Item upgraded!");
                     // No need to rebuild the whole grid, just update the details pane and main UI
                     updateSelectedItemDetails(itemIndexToUpdate); // Update details for the same item
                     updateUI(); // Update gold in main panel
                 } else {
                     addLogMessage("Upgrade failed."); // Add feedback (e.g., not enough gold)
                     // Update details to show potentially changed gold/cost, keep selection
                     updateSelectedItemDetails(itemIndexToUpdate);
                 }
             }
         });

        console.log("Inventory listeners attached.");
    } else {
         console.error("Cannot setup Inventory listeners - elements missing.");
    }

    // -- Auth Form Listeners --
    if (showLoginLink && showRegisterLink && loginForm && registerForm) {
        showLoginLink.addEventListener('click', (e) => {
            e.preventDefault();
            loginForm.style.display = 'block';
            registerForm.style.display = 'none';
        });
        showRegisterLink.addEventListener('click', (e) => {
            e.preventDefault();
            registerForm.style.display = 'block';
            loginForm.style.display = 'none';
        });
        console.log("Auth form toggle listeners attached.");
    } else {
        console.error("Cannot setup Auth form toggle listeners - elements missing.");
    }

} // End of setupListeners function

// Setup listeners once the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOMContentLoaded fired. Setting up listeners.");
    setupListeners();
    // Initial UI state is handled by auth.js checking token
    // Call updateUI here to render the initial panel structure
    updateUI();
    // Ensure overlays are hidden initially
    hideOverlay(dialogueBox);
    hideOverlay(inventoryScreen);
    hideOverlay(statModal);
    // Auth forms visibility is handled by auth.js
});

// No longer need the final export block as functions are exported individually
