/**
 * UOR (Universal Object Reference) Module
 *
 * Implements the algebraic ring Z/(2^6)Z with 64 elements (0-63)
 * converging with the 64-vertex lattice and Zero Knowledge proof space.
 *
 * Mathematical Foundation:
 * - Ring: Z/(2^6)Z (integers modulo 64)
 * - Two canonical involutions: neg (additive) and bnot (bitwise)
 * - Five hammer strikes (operations): neg, bnot, xor, and, or
 * - Core identity: neg(bnot(x)) = succ(x)
 *
 * The convergence:
 * - UOR discovered it algebraically (ring strata, popcount distribution)
 * - 64-Tetrahedra discovered it geometrically (tetrahedral lattice vertices)
 * - Zero Knowledge discovered it cryptographically (witness bound spaces)
 *
 * Reference: UOR Foundation (https://github.com/UOR-Foundation)
 * Integration: agentprivacy-docs, Acts XXVII-XXIX
 *
 * @version 1.0.0
 * @date March 31, 2026
 */

// Ring modulus: 2^6 = 64
export const RING_MODULUS = 64;
export const BIT_WIDTH = 6;
export const MAX_VALUE = RING_MODULUS - 1; // 63

/**
 * Triadic Coordinates for ring elements
 * Every element has three independent coordinates
 */
export interface TriadicCoordinates {
  /** The raw ring element value (0-63) */
  datum: number;
  /** Hamming weight / popcount (0-6) - determines blade tier */
  stratum: number;
  /** Which basis bits are set - the 6-bit address */
  spectrum: [number, number, number, number, number, number];
}

/**
 * The Five Hammer Strikes (Ring Operations)
 * These operations form the computational basis of the forge
 */
export const UOR = {
  /**
   * Additive negation (arithmetic complement)
   * neg(x) = 64 - x mod 64
   *
   * Properties:
   * - Involution: neg(neg(x)) = x
   * - Within-vertex temper (inverts quality, preserves position)
   */
  neg: (x: number): number => (RING_MODULUS - x) % RING_MODULUS,

  /**
   * Bitwise complement (bitwise NOT)
   * bnot(x) = 63 - x = x XOR 63
   *
   * Properties:
   * - Involution: bnot(bnot(x)) = x
   * - Antipodal jump (flips ALL dimensions - mirror blade)
   */
  bnot: (x: number): number => MAX_VALUE - x,

  /**
   * Symmetric difference (XOR)
   * xor(x, y) = x ⊕ y
   *
   * Properties:
   * - Toggles specific edges between vertices
   * - Lifts to address space (carry-free)
   */
  xor: (x: number, y: number): number => x ^ y,

  /**
   * Intersection (AND)
   * and(x, y) = x ∧ y
   *
   * Properties:
   * - Moves toward null blade ⟨0,0,0,0,0,0⟩
   * - Constrains to shared edges only
   * - Lifts to address space (carry-free)
   */
  and: (x: number, y: number): number => x & y,

  /**
   * Union (OR)
   * or(x, y) = x ∨ y
   *
   * Properties:
   * - Moves toward full sovereignty ⟨1,1,1,1,1,1⟩
   * - Expands to combined edges
   * - Lifts to address space (carry-free)
   */
  or: (x: number, y: number): number => x | y,

  /**
   * Successor function (add 1)
   * succ(x) = (x + 1) mod 64
   *
   * CRITICAL: This is NOT a primitive operation!
   * It is derived from the composition: succ = neg ∘ bnot
   */
  succ: (x: number): number => (x + 1) % RING_MODULUS,

  /**
   * Predecessor function (subtract 1)
   * pred(x) = (x - 1 + 64) mod 64
   */
  pred: (x: number): number => (x - 1 + RING_MODULUS) % RING_MODULUS,

  /**
   * Verify the Core Identity: neg(bnot(x)) = succ(x)
   *
   * This is the foundational theorem of the UOR-Forge convergence:
   * "Deny the complement, and you advance"
   *
   * The composition of two involutions generates the successor.
   * This proves the dihedral group D_{64} is computationally complete.
   */
  verifyCriticalIdentity: (x: number): boolean => {
    const composed = UOR.neg(UOR.bnot(x));
    const successor = UOR.succ(x);
    return composed === successor;
  },

  /**
   * Verify the critical identity holds for ALL elements
   * Should return true (exhaustive verification)
   */
  verifyIdentityExhaustive: (): boolean => {
    for (let x = 0; x < RING_MODULUS; x++) {
      if (!UOR.verifyCriticalIdentity(x)) {
        return false;
      }
    }
    return true;
  },

  /**
   * Compute Hamming weight (popcount) - determines stratum
   * Returns the number of 1-bits in the 6-bit representation
   */
  popcount: (x: number): number => {
    let count = 0;
    let n = x;
    while (n) {
      count += n & 1;
      n >>= 1;
    }
    return count;
  },

  /**
   * Get spectrum (6-bit address) as array
   */
  spectrum: (x: number): [number, number, number, number, number, number] => {
    return [
      (x >> 0) & 1, // d1: Protection
      (x >> 1) & 1, // d2: Delegation
      (x >> 2) & 1, // d3: Memory
      (x >> 3) & 1, // d4: Connection
      (x >> 4) & 1, // d5: Computation
      (x >> 5) & 1, // d6: Value
    ];
  },

  /**
   * Get full triadic coordinates for a ring element
   */
  coordinates: (x: number): TriadicCoordinates => {
    return {
      datum: x,
      stratum: UOR.popcount(x),
      spectrum: UOR.spectrum(x),
    };
  },

  /**
   * Convert spectrum back to datum
   */
  fromSpectrum: (s: [number, number, number, number, number, number]): number => {
    return s[0] + s[1] * 2 + s[2] * 4 + s[3] * 8 + s[4] * 16 + s[5] * 32;
  },
};

/**
 * Blade Tier Classification
 * Based on stratum (Hamming weight / popcount)
 */
export type BladeTier = 'null' | 'light' | 'heavy' | 'dragon';

export const getTier = (stratum: number): BladeTier => {
  if (stratum === 0) return 'null';
  if (stratum <= 2) return 'light';
  if (stratum <= 4) return 'heavy';
  return 'dragon';
};

export const TIER_COLORS: Record<BladeTier, string> = {
  null: '#808080',   // Gray
  light: '#87ceeb',  // Sky Blue
  heavy: '#c0c0c0',  // Silver
  dragon: '#ffd700', // Gold
};

/**
 * Pascal's Triangle Row 6: Vertex distribution by stratum
 * 1 + 6 + 15 + 20 + 15 + 6 + 1 = 64
 */
export const PASCAL_ROW_6 = [1, 6, 15, 20, 15, 6, 1];

/**
 * Six Dimensions of Sovereignty
 *
 * Canonical names (from spec) vs Implementation names (from code)
 */
export const DIMENSIONS = {
  d1: { canonical: 'Protection', impl: 'Hide', meaning: 'Key Custody' },
  d2: { canonical: 'Delegation', impl: 'Commit', meaning: 'Credential Disclosure' },
  d3: { canonical: 'Memory', impl: 'Prove', meaning: 'Agent Delegation' },
  d4: { canonical: 'Connection', impl: 'Connect', meaning: 'Data Residency' },
  d5: { canonical: 'Computation', impl: 'Reflect', meaning: 'Interaction Mode' },
  d6: { canonical: 'Value', impl: 'Delegate', meaning: 'Trust Boundary' },
} as const;

/**
 * Notable Blades (Hexagram correspondences)
 */
export const NOTABLE_BLADES = {
  NULL: 0,           // ⟨0,0,0,0,0,0⟩ - 坤 The Receptive
  FULL: 63,          // ⟨1,1,1,1,1,1⟩ - 乾 The Creative (Dragon)
  SWORDSMAN_MAGE: 3, // ⟨1,1,0,0,0,0⟩ - Protection + Delegation (Twin-edge)
} as const;

/**
 * Dihedral Group D_64
 * Generated by the two involutions neg and bnot
 * Order: 2 × 64 = 128
 */
export const DihedralGroup = {
  /** Group order */
  order: 2 * RING_MODULUS, // 128

  /** Presentation: D_64 = ⟨neg, bnot | neg² = bnot² = 1, (neg∘bnot)^64 = 1⟩ */
  presentation: 'D_64 = ⟨neg, bnot | neg² = bnot² = 1, (neg∘bnot)^64 = 1⟩',

  /** The critical composition law */
  criticalComposition: 'neg ∘ bnot = succ',
};

/**
 * Holographic Bound Constants (V5)
 */
export const HOLOGRAPHIC = {
  vertices: 64,
  edges: 96,
  ratio: 1.5, // 96/64 = P^1.5
  /** Boundary holds the whole */
  principle: 'Information content lives on the 96-edge boundary, not the 64-vertex bulk',
};

/**
 * Content Addressing (Braille IRI)
 * Same bytes → same blade → same GUID
 */
export const contentAddress = (datum: number): string => {
  // Simplified Braille encoding (6-bit chunks to Braille)
  // Full implementation would use UOR Foundation's Braille glyph system
  const brailleBase = 0x2800; // Unicode Braille Patterns block
  const glyph = String.fromCodePoint(brailleBase + datum);
  return `uor:${glyph}`;
};

/**
 * Zero Knowledge Correspondence
 * Multiple paths to same vertex = Multiple witnesses to same statement
 */
export const ZK_PRINCIPLE = {
  statement: 'Same blade, infinite forgings',
  meaning: 'Verifier sees the blade. The witness (path) dissolves.',
  property: 'Zero knowledge: Verify blade without revealing forging path',
};

// Export module info
export const MODULE_INFO = {
  name: 'UOR (Universal Object Reference)',
  version: '1.0.0',
  ring: 'Z/(2^6)Z',
  elements: 64,
  reference: 'https://github.com/UOR-Foundation',
  integration: 'agentprivacy-docs Acts XXVII-XXIX',
};

export default UOR;
