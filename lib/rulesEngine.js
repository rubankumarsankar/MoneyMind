/**
 * Rules Engine for Auto-Categorization
 */

export const RulesEngine = {
    /**
     * Matches a connection description against a list of rules
     * @param {string} description - The note or description of the expense
     * @param {Array} rules - List of CategoryRule objects
     * @returns {string|null} - The matched category or null
     */
    matchCategory: (description, rules) => {
        if (!description || !rules || rules.length === 0) return null;

        const normalizedDesc = description.toLowerCase();

        // Sort rules by specificity (Exact > StartsWith > Contains) ??
        // Or just iterate. Let's iterate in order provided or prioritize exact matches.
        
        // 1. Check EXACT matches first
        const exactMatch = rules.find(r => r.matchType === 'EXACT' && r.pattern.toLowerCase() === normalizedDesc);
        if (exactMatch) return exactMatch.category;

        // 2. Check STARTS_WITH
        const startMatch = rules.find(r => r.matchType === 'STARTS_WITH' && normalizedDesc.startsWith(r.pattern.toLowerCase()));
        if (startMatch) return startMatch.category;

        // 3. Check CONTAINS (Default)
        const containsMatch = rules.find(r => (r.matchType === 'CONTAINS' || !r.matchType) && normalizedDesc.includes(r.pattern.toLowerCase()));
        if (containsMatch) return containsMatch.category;

        return null;
    }
};
