import { BASE_HIT_CHANCE, DEXTERITY_HIT_MODIFIER } from './config.js';
import { player, gainXP, getStatBonus, addItemToInventory, useItem, savePlayerData } from './player.js'; // Added useItem and savePlayerData import
import { removeEnemy } from './enemy.js'; // Keep for removing enemy on victory
import { items, generateInitialSubstats } from './items.js'; // Added generateInitialSubstats import

// Define action result constants
export const ACTION_RESULT = {
    SUCCESS_ANIMATING: 'success_animating',
    SUCCESS_NO_ANIMATION: 'success_no_animation',
    FAILED: 'failed',
    ENDED_COMBAT: 'ended_combat'
};

// --- Combat State ---
let currentEnemy = null;
let isPlayerTurn = true;
let combatMessageLog = [];
// let combatEnded = false; // Replaced by combatResult
let playerActionSelected = false; // Flag to prevent multiple actions per turn
let combatResult = { // New state to track how combat ended
    ended: false,
    reason: null, // 'victory', 'defeat', 'flee'
    defeatedEnemyId: null
};

// --- Animation State ---
export let isAnimating = false;
export let animatingCharacter = null; // 'player' or 'enemy'
export let animationProgress = 0; // 0 to 1
export const ANIMATION_SPEED = 0.05; // Controls how fast animation progresses per frame

// Function to update animation progress internally
export function updateAnimationProgress() {
    if (isAnimating) {
        animationProgress += ANIMATION_SPEED;
        if (animationProgress >= 1) {
            isAnimating = false;
            animationProgress = 0;
            animatingCharacter = null;
            return true; // Indicate animation finished
        }
    }
    return false; // Indicate animation ongoing or not active
}

// --- Combat Calculation --- (Keep calculateHitChance)
function calculateHitChance(attackerDex, defenderDex) {
    const dexDifference = attackerDex - defenderDex;
    let hitChance = BASE_HIT_CHANCE + (dexDifference * DEXTERITY_HIT_MODIFIER);
    hitChance = Math.max(0.05, Math.min(0.95, hitChance)); // Clamp 5%-95%
    return hitChance;
}

// Calculate Flee Chance
function calculateFleeChance() {
    if (!currentEnemy) return 0; // Cannot flee if no enemy

    const BASE_FLEE_CHANCE = 0.50; // 50% base chance
    const LEVEL_DIFF_MODIFIER = 0.05; // 5% change per level difference
    const SPEED_MODIFIER = 0.01; // 1% change per point of speed

    const levelDifference = player.level - currentEnemy.level;
    // Player speed is calculated in player.js (includes item bonuses)
    const speedDifference = player.speed; // Enemies don't have speed yet

    let fleeChance = BASE_FLEE_CHANCE + (levelDifference * LEVEL_DIFF_MODIFIER) + (speedDifference * SPEED_MODIFIER);

    // Clamp flee chance between 5% and 95%
    fleeChance = Math.max(0.05, Math.min(0.95, fleeChance));
    console.log(`Calculated Flee Chance: ${fleeChance.toFixed(2)} (LvlDiff: ${levelDifference}, Speed: ${speedDifference})`);
    return fleeChance;
}


// --- Combat Logging ---
function addCombatLog(message) {
    combatMessageLog.push(message);
    // Keep log size manageable (e.g., last 5 messages)
    if (combatMessageLog.length > 5) {
        combatMessageLog.shift();
    }
    console.log(`[Combat Log] ${message}`); // Also log to console
}

export function getCombatLog() {
    return combatMessageLog;
}

// --- Combat Actions ---
function playerAttack() {
    if (!currentEnemy) return;
    addCombatLog("Player attacks!");

    // Start animation
    isAnimating = true;
    animatingCharacter = 'player';
    animationProgress = 0;

    // Calculate damage immediately
    const playerDex = player.dexterity + getStatBonus('dexterity');
    const playerHitChance = calculateHitChance(playerDex, currentEnemy.dexterity);

    if (Math.random() <= playerHitChance) {
        let playerTotalAttack = player.attack + getStatBonus('attack');
        let playerTotalStrength = player.strength + getStatBonus('strength');
        let playerBaseDamage = playerTotalAttack + playerTotalStrength;
        let damageReduction = currentEnemy.defense;
        let playerDamageDealt = Math.max(1, playerBaseDamage - damageReduction);

        currentEnemy.hp -= playerDamageDealt;
        addCombatLog(`Player hits ${currentEnemy.type} (Lvl ${currentEnemy.level}) for ${playerDamageDealt} damage.`); // Added level display
    } else {
        addCombatLog(`Player misses ${currentEnemy.type} (Lvl ${currentEnemy.level}).`); // Added level display
    }
    checkCombatEnd();
}

function enemyAttack() {
    if (!currentEnemy || combatEnded) return;
    addCombatLog(`${currentEnemy.type} (Lvl ${currentEnemy.level}) attacks!`); // Added level display

    // Start animation
    isAnimating = true;
    animatingCharacter = 'enemy';
    animationProgress = 0;

    // Calculate damage immediately
    const playerDex = player.dexterity + getStatBonus('dexterity');
    const enemyHitChance = calculateHitChance(currentEnemy.dexterity, playerDex);

    if (Math.random() <= enemyHitChance) {
        let enemyBaseDamage = currentEnemy.attack;
        let playerTotalDefense = player.defense + getStatBonus('defense');
        let damageReduction = playerTotalDefense;
        let enemyDamageDealt = Math.max(1, enemyBaseDamage - damageReduction);

        player.hp -= enemyDamageDealt;
        addCombatLog(`${currentEnemy.type} (Lvl ${currentEnemy.level}) hits Player for ${enemyDamageDealt} damage.`); // Added level display
    } else {
        addCombatLog(`${currentEnemy.type} (Lvl ${currentEnemy.level}) misses Player.`); // Added level display
    }
    checkCombatEnd();
}

// --- Turn & State Management ---
export function startCombat(enemy) {
    currentEnemy = enemy;
    isPlayerTurn = true; // Player usually goes first
    // combatEnded = false; // Replaced by combatResult reset
    playerActionSelected = false;
    combatResult = { ended: false, reason: null, defeatedEnemyId: null }; // Reset result
    combatMessageLog = [`Encountered ${enemy.type} (Lvl ${enemy.level})!`]; // Added level display
    console.log("Combat started in combat.js");
}

function checkCombatEnd() {
    if (combatResult.ended) return true; // Already ended

    if (currentEnemy && currentEnemy.hp <= 0) {
        addCombatLog(`${currentEnemy.type} (Lvl ${currentEnemy.level}) defeated!`); // Added level display
        // --- Rewards ---
        // XP
        gainXP(currentEnemy.xpReward); // Use the scaled xpReward from the enemy object
        // Gold
        if (currentEnemy.goldDrop > 0) {
            player.gold += currentEnemy.goldDrop;
            addCombatLog(`Player gained ${currentEnemy.goldDrop} gold.`);
            savePlayerData(); // Save after gaining gold
        }
        // --- Item Drop Logic (Themed) ---
        if (currentEnemy.dropTable && currentEnemy.dropTable.length > 0) {
            addCombatLog("Checking for drops...");
            const numberOfDrops = Math.floor(Math.random() * 3); // Up to 3 drops
            for (let i = 0; i < numberOfDrops; i++) {
                currentEnemy.dropTable.forEach(drop => {
                    const increasedChance = Math.min(1.0, drop.chance + 0.2); // Increase chance by 20%, max 100%
                    if (Math.random() < increasedChance) {
                        const itemDefinition = items[drop.itemKey]; // Get the base definition
                        if (itemDefinition) {
                            // Create a unique instance of the item
                            const newItemInstance = { ...itemDefinition };

                            // If the item is equippable (has rarity), generate substats
                            if (newItemInstance.rarity) {
                                newItemInstance.substats = generateInitialSubstats(itemDefinition);
                                // Ensure upgradeLevel is initialized if not present (though it should be)
                                newItemInstance.upgradeLevel = newItemInstance.upgradeLevel || 0;
                            }

                            // Add the specific instance (with potential substats) to inventory
                            addItemToInventory(newItemInstance);
                            addCombatLog(`Enemy dropped ${newItemInstance.name}!`);
                        } else {
                            console.warn(`Item key '${drop.itemKey}' not found in items.js for drop table.`);
                        }
                    }
                });
            }
        }

        // --- Cleanup ---
        const defeatedEnemy = currentEnemy; // Store reference before nulling
        removeEnemy(defeatedEnemy); // Remove from client's game world immediately
        combatResult = { ended: true, reason: 'victory', defeatedEnemyId: defeatedEnemy.id }; // Set result
        currentEnemy = null; // Clear current enemy reference
        // combatEnded = true; // Replaced by combatResult
        addCombatLog("Victory!");
        return true; // Indicate combat ended
    }

    if (player.hp <= 0) {
        addCombatLog("Player defeated! Game Over.");
        combatResult = { ended: true, reason: 'defeat', defeatedEnemyId: null }; // Set result
        // combatEnded = true; // Replaced by combatResult
        // Game over logic will be handled in game.js based on combatResult state
        return true; // Indicate combat ended
    }
    return false;
}

export function nextTurn() { // Added export keyword
    if (combatResult.ended) return; // Check new result state
    isPlayerTurn = !isPlayerTurn;
    playerActionSelected = false; // Reset flag for player's next turn
    addCombatLog(`--- ${isPlayerTurn ? "Player's" : "Enemy's"} Turn ---`);

    if (!isPlayerTurn) {
        // Simple enemy AI: just attack
        enemyAttack(); // Trigger attack (sets animation state, calculates damage)
        // The turn progression happens after the animation finishes in game.js updateCombat
    }
}

/**
 * Processes player input during combat.
 * Returns an ACTION_RESULT status.
 * @param {string} action - The action chosen by the player (e.g., 'attack', 'item', 'flee').
 */
export function processPlayerAction(action) {
    // Check new result state
    if (!isPlayerTurn || combatResult.ended || playerActionSelected) {
        // Return FAILED if action cannot be taken
        return ACTION_RESULT.FAILED;
    }

    playerActionSelected = true; // Mark action as taken for this turn
    let actionResult = ACTION_RESULT.FAILED; // Default to failed

    switch (action.toLowerCase()) {
        case 'attack':
            playerAttack(); // Sets isAnimating = true
            actionResult = ACTION_RESULT.SUCCESS_ANIMATING;
            break;
        case 'item':
            // Simple implementation: Use first Health Potion if available
            // TODO: Add UI for item selection during combat
            addCombatLog("Player attempts to use an item...");
            const itemUsed = useItem('Health Potion');
            if (itemUsed) {
                addCombatLog("Used Health Potion.");
                actionResult = ACTION_RESULT.SUCCESS_NO_ANIMATION; // Success, no animation
            } else {
                addCombatLog("Could not use Health Potion (None available or HP full).");
                playerActionSelected = false; // Allow another action if item use fails
                actionResult = ACTION_RESULT.FAILED;
            }
            break;
        case 'flee':
            addCombatLog("Player attempts to flee...");
            const fleeChance = calculateFleeChance();
            if (Math.random() <= fleeChance) {
                addCombatLog("Successfully fled from combat!");
                combatResult = { ended: true, reason: 'flee', defeatedEnemyId: null }; // Set result
                currentEnemy = null;
                actionResult = ACTION_RESULT.ENDED_COMBAT; // Combat ended
            } else {
                addCombatLog("Failed to flee!");
                actionResult = ACTION_RESULT.SUCCESS_NO_ANIMATION; // Action succeeded (turn used), but no animation
            }
            break;
        default:
            addCombatLog("Unknown action.");
            playerActionSelected = false; // Allow another action
            actionResult = ACTION_RESULT.FAILED;
            break; // Ensure break here
    }

    // Check if combat ended *after* the action (e.g., player attack killed enemy)
    // Don't override if action itself ended combat (like successful flee)
    if (actionResult !== ACTION_RESULT.ENDED_COMBAT && checkCombatEnd()) {
         // If checkCombatEnd returns true, it means the enemy or player was defeated by the action.
         actionResult = ACTION_RESULT.ENDED_COMBAT;
    }

    // If the action failed, don't proceed the turn
    if (actionResult === ACTION_RESULT.FAILED) {
        playerActionSelected = false; // Reset flag so player can try again
    }

    // Return the result status
    return actionResult;
}

// Replace isCombatEnded with getCombatResult
// export function isCombatEnded() {
//     return combatEnded;
// }
export function getCombatResult() {
    return combatResult;
}


export function getCurrentCombatEnemy() {
    return currentEnemy;
}

// Remove the old handleCombat function as it's replaced by the turn-based logic
// export function handleCombat(enemy) { ... }
