import { BASE_HIT_CHANCE, DEXTERITY_HIT_MODIFIER } from './config.js';
import { player, gainXP, getStatBonus, addItemToInventory } from './player.js';
import { removeEnemy } from './enemy.js'; // Keep for removing enemy on victory
import { items } from './items.js';

// --- Combat State ---
let currentEnemy = null;
let isPlayerTurn = true;
let combatMessageLog = [];
let combatEnded = false;
let playerActionSelected = false; // Flag to prevent multiple actions per turn

// --- Animation State ---
export let isAnimating = false;
export let animatingCharacter = null; // 'player' or 'enemy'
export let animationProgress = 0; // 0 to 1
export const ANIMATION_SPEED = 0.05; // Controls how fast animation progresses per frame

// --- Combat Calculation --- (Keep calculateHitChance)
function calculateHitChance(attackerDex, defenderDex) {
    const dexDifference = attackerDex - defenderDex;
    let hitChance = BASE_HIT_CHANCE + (dexDifference * DEXTERITY_HIT_MODIFIER);
    hitChance = Math.max(0.05, Math.min(0.95, hitChance)); // Clamp 5%-95%
    return hitChance;
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
    combatEnded = false;
    playerActionSelected = false;
    combatMessageLog = [`Encountered ${enemy.type} (Lvl ${enemy.level})!`]; // Added level display
    console.log("Combat started in combat.js");
}

function checkCombatEnd() {
    if (combatEnded) return; // Already ended

    if (currentEnemy && currentEnemy.hp <= 0) {
        addCombatLog(`${currentEnemy.type} (Lvl ${currentEnemy.level}) defeated!`); // Added level display
        // --- Rewards ---
        // XP
        gainXP(currentEnemy.xpReward); // Use the scaled xpReward from the enemy object
        // Gold
        if (currentEnemy.goldDrop > 0) {
            player.gold += currentEnemy.goldDrop;
            addCombatLog(`Player gained ${currentEnemy.goldDrop} gold.`);
        }
        // --- Item Drop Logic (Themed) ---
        if (currentEnemy.dropTable && currentEnemy.dropTable.length > 0) {
            addCombatLog("Checking for drops...");
            const numberOfDrops = Math.floor(Math.random() * 3); // Up to 3 drops
            for (let i = 0; i < numberOfDrops; i++) {
                currentEnemy.dropTable.forEach(drop => {
                    const increasedChance = Math.min(1.0, drop.chance + 0.2); // Increase chance by 20%, max 100%
                    if (Math.random() < increasedChance) {
                        const itemData = items[drop.itemKey];
                        if (itemData) {
                            addItemToInventory(itemData); // Use function from player.js
                            addCombatLog(`Enemy dropped ${itemData.name}!`);
                        } else {
                            console.warn(`Item key '${drop.itemKey}' not found in items.js for drop table.`);
                        }
                    }
                });
            }
        }

        // --- Cleanup ---
        const defeatedEnemy = currentEnemy; // Store reference before nulling
        removeEnemy(defeatedEnemy); // Remove from game world
        currentEnemy = null;
        combatEnded = true;
        addCombatLog("Victory!");
        return true;
    }

    if (player.hp <= 0) {
        addCombatLog("Player defeated! Game Over.");
        combatEnded = true;
        // Game over logic will be handled in game.js based on combatEnded state
        return true;
    }
    return false;
}

export function nextTurn() { // Added export keyword
    if (combatEnded) return;
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
 * Returns true if the combat should end.
 * @param {string} action - The action chosen by the player (e.g., 'attack', 'item', 'flee').
 */
export function processPlayerAction(action) {
    if (!isPlayerTurn || combatEnded || playerActionSelected) {
        return combatEnded; // Don't allow action if not player's turn, combat ended, or action already taken
    }

    playerActionSelected = true; // Mark action as taken for this turn

    switch (action.toLowerCase()) {
        case 'attack':
            playerAttack();
            break;
        case 'item':
            // TODO: Implement item usage in combat (needs UI selection)
            addCombatLog("Using items not implemented yet.");
            playerActionSelected = false; // Allow another action if item use fails/is cancelled
            return combatEnded; // Don't advance turn yet
        case 'flee':
            // TODO: Implement flee chance
            addCombatLog("Fleeing not implemented yet.");
             playerActionSelected = false; // Allow another action if flee fails
            return combatEnded; // Don't advance turn yet
        default:
            addCombatLog("Unknown action.");
            playerActionSelected = false; // Allow another action
            return combatEnded;
    }

    // If an action was successfully taken (attack), check end.
    // Turn progression will be handled in game.js after animation.
    checkCombatEnd();
    // We don't call nextTurn here anymore if animating

    return combatEnded;
}

export function isCombatEnded() {
    return combatEnded;
}

export function getCurrentCombatEnemy() {
    return currentEnemy;
}

// Remove the old handleCombat function as it's replaced by the turn-based logic
// export function handleCombat(enemy) { ... }
