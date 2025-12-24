
import { Instability } from '../types';

export const ATLAS_DATA: Instability[] = [
  {
    id: 'MATH-006',
    canonicalName: 'The Infinity Cancellation Mechanism',
    domain: 'FØZ Theory',
    description: "A pure demonstration of the 'Fundamental Theorem of FØZ': How two distinct types of infinity (linear divergences) are strictified into finite torsion cycles and exactly cancelled against each other.",
    mathematicalFormulation: 'Linear: x → ∞ implies Divergence. \nTorsion: x mod N = 0 implies Stability.',
    simplifiedMathExplanation: "The arrow `→ ∞` usually means a value grows without limit. In FØZ, `mod N = 0` redefines 'growth' as moving around a circle. If you move `N` steps on a circle of size `N`, you end up back at 0. This mathematically converts 'infinite distance' into 'zero displacement'.",
    fozInterpretation: {
      summary: "This visualizer demonstrates the core mechanism of 'Strictification'. Classical infinities are viewed as linear paths that never return. FØZ maps these paths onto Finite Abelian Groups (circles). By choosing the correct 'weights' (periods), two such 'infinities' can be made to cancel each other out exactly, returning the system to a zero-energy state.",
      lambdaTermExample: "The modulus N acts as the regulator λ.",
      strictification: "Mapping the real line R to the circle S1 (or Z/NZ).",
      homotopyPath: "1. Start with two diverging linear paths in R (Infinity). \n2. Apply the strictification map S: R -> Z/NZ (wrapping). \n3. The paths become cycles C1 and C2. \n4. Tune periods A and B such that A+B = 0 in the combined group algebra. \n5. Result: The 'infinite' energy sum cancels to zero."
    },
    experimentComponent: 'TorsionCancellation'
  },
  {
    id: 'PHY-001',
    canonicalName: 'Black Hole Singularity',
    domain: 'General Relativity',
    description: "The point in spacetime at which celestial bodies are predicted to have infinite density and zero volume by general relativity. The laws of physics as we know them break down here.",
    mathematicalFormulation: 'Divergence of curvature invariants as r → 0 in metrics.',
    simplifiedMathExplanation: "`r → 0` means looking at the exact center of the black hole. `Curvature → ∞` means the fabric of space is bent infinitely sharp. In FØZ, this isn't a crash; it's a boundary where the geometry wraps around (torsion), preventing the value from actually hitting infinity.",
    fozInterpretation: {
      summary: 'Re-interpreted via Torsion Algebras of Infinity (FFZ). The singularity is not a breakdown, but an element in a finite torsion group M_{a,b}. The "infinity" (1,0) and "negative infinity" (0,1) cancel exactly via Fibonacci weights: F_n(∞) + F_{n+1}(-∞) = 0. This algebraic cancellation resolves the geometric singularity.',
      lambdaTermExample: 'The stabilizer is the torsion relation itself: a·x = 0 in Z/aZ.',
      obstruction: 'A non-trivial cohomology class representing information loss',
    },
    experimentComponent: 'BlackHole'
  },
  {
    id: 'CS-ML-001',
    canonicalName: 'Vanishing/Exploding Gradients',
    domain: 'Machine Learning',
    description: "A difficulty found in training artificial neural networks with gradient-based learning methods and backpropagation. Gradients can become exceedingly small or large, preventing the network from learning effectively.",
    mathematicalFormulation: 'Product of Jacobians ∂h_t/∂h_k = Π(∂h_i/∂h_{i-1}) can go to 0 or ∞.',
    simplifiedMathExplanation: "The symbol `Π` (Pi) means multiplying many numbers together. If you multiply many numbers slightly larger than 1, the result explodes to infinity (`∞`). If slightly smaller than 1, it vanishes to `0`. FØZ stabilizes this multiplication so the result stays in a 'Goldilocks' zone.",
    fozInterpretation: {
      summary: "Model gradient propagation as a dynamical system. The instability is a chaotic divergence. Apply FFZ-stabilized matrix multiplication (⊗) to the Jacobian product at each step. This acts as a renormalization flow (Axiom 18), keeping the norm of the gradient within bounded, computable limits.",
      lambdaTermExample: 'A stabilization parameter ε in the FFZ-stabilized matrix multiplication',
      strictification: 'The instability can be "gauged away" by re-parameterizing the network layers.'
    },
    experimentComponent: 'GradientFlow'
  },
  {
    id: 'CS-001',
    canonicalName: 'P versus NP',
    domain: 'Computer Science',
    description: "One of the most profound open questions in computer science, it asks whether every problem whose solution can be quickly verified (NP) can also be quickly solved (P). The FØZ framework approaches this not by direct proof, but by attempting to construct polynomial-time solutions for NP-complete problems.",
    mathematicalFormulation: 'Question: Does P = NP?',
    fozInterpretation: {
      summary: "The FØZ strategy reframes NP-complete problems, like Subset Sum, from a discrete combinatorial search into a continuous optimization problem. The core hypothesis is that NP-hardness is an artifact of discrete formulations, and an FFZ-Homotopy can trace a polynomial-time path through a stabilized computational landscape to find a solution, suggesting P=NP within this framework.",
      lambdaTermExample: 'The stabilization of the cost function gradient, `stab(∇C(x_t), ε_grad)`, prevents the optimizer from getting trapped in local minima.',
      obstruction: 'The exponential explosion of the search space (e.g., O(2^n)) for classical brute-force algorithms.',
      strictification: 'The FØZ-Optimizer effectively "tunnels" through complex regions of the cost landscape. This suggests the problem\'s complexity is not in the search space size, but in the geometric properties of the stabilized landscape, which can be navigated efficiently.',
      homotopyPath: "1. Define discrete problem instance I in NP. \n2. Embed I into a continuous manifold M via relaxation. \n3. Apply FØZ-Flow: dx/dt = -grad(Cost(x)) + Torsion_Correction. \n4. The flow avoids local minima due to torsion terms. \n5. Converge to fixed point x* in polynomial time. \n6. Project x* back to discrete solution."
    },
    experimentComponent: 'SubsetSum'
  },
   {
    id: 'CS-002',
    canonicalName: 'The Subset Sum Problem',
    domain: 'Computer Science',
    description: "Given a set of integers, the problem is to determine if a non-empty subset exists whose elements sum to exactly zero. It is a classic NP-complete problem.",
    mathematicalFormulation: 'C(x) = stab( | Σ(xᵢ * sᵢ) | , ε_sum) + α * stab( Σ[xᵢ * (1 - xᵢ)], ε_penalty)',
    simplifiedMathExplanation: "`Σ` sums up the numbers. The `|...|` takes the absolute difference from zero. The term `xᵢ * (1 - xᵢ)` is a math trick that forces `x` to be either 0 or 1. `stab()` is the FØZ function that prevents the computer from crashing when values get too close to singular points.",
    fozInterpretation: {
      summary: 'The discrete problem of choosing subset elements is converted into a continuous optimization problem. A state vector `x` with components between 0 and 1 represents the probability of each element being in the subset. A stabilized cost function is minimized using a custom FØZ-Optimizer (Stabilized Gradient Descent) to drive `x` components towards 0 or 1, revealing the solution subset.',
      lambdaTermExample: 'The stab() function acts as a λ-term, preventing numerical instability near zero for both the sum and discreteness costs.',
      obstruction: 'The combinatorial explosion of the discrete search space, which manifests as a rugged, high-dimensional cost landscape for classical optimizers.',
      strictification: 'The FØZ-Optimizer "smooths" the landscape via gradient stabilization, allowing it to find a continuous path to the solution, effectively trivializing the obstruction.'
    },
    experimentComponent: 'SubsetSum'
  },
  {
    id: 'MATH-001',
    canonicalName: "Russell's Paradox",
    domain: 'Set Theory',
    description: "A paradox in naive set theory that shows that the collection of all sets that do not contain themselves as members cannot be a set, leading to contradictions.",
    mathematicalFormulation: 'The set R = {x | x ∉ x} leads to R ∈ R ⇔ R ∉ R.',
    simplifiedMathExplanation: "The definition `R = {x | x ∉ x}` creates a vicious cycle. It asks: 'Does the list of all lists that don't list themselves, list itself?' If yes, then no. If no, then yes. FØZ treats this logical flip-flop as a computational loop that consumes energy (budget) rather than a truth value.",
    fozInterpretation: {
      summary: 'The paradox arises from an ill-defined self-reference. In an FFZ-based type theory, such constructions would be flagged by a non-trivial stabilizer term λ, indicating a computational obstruction. The existence of R is not a binary yes/no but a "stabilized object" whose properties are ε-dependent.',
      obstruction: 'A non-terminating computational process when evaluating R ∈ R'
    },
    experimentComponent: 'RussellsParadox'
  },
  {
    id: 'PHY-006',
    canonicalName: 'Quantum Recurrence / The Infinity Clock',
    domain: 'Physics',
    description: "Classical and semi-classical systems struggle to produce exact, long-period oscillations (Time Crystals) without infinite resources. The FFZ model provides a 'Quantum Clock of Infinity' using only two qudits.",
    mathematicalFormulation: 'Period T = F_n · F_{n+1} ~ φ^(2n) using Hamiltonian H = |1><1| ⊗ U ⊗ V',
    simplifiedMathExplanation: "`T ~ φ^(2n)` means the clock's duration grows exponentially (like the Golden Ratio φ), even though the system size `n` only grows linearly. FØZ achieves this 'infinite' duration in a finite system by exploiting the mathematical properties of Fibonacci numbers.",
    fozInterpretation: {
      summary: "This is the flagship application of the Torsion Algebra of Infinity. By using two torsion generators with coprime orders (Fibonacci numbers), we create a system that cancels divergence locally but exhibits super-exponential periodicity globally. It is the first 'finite, exact' realization of an infinite clock.",
      lambdaTermExample: "The 'twisted torsion' phases ω = exp(2πi/p) used in the crossed-product module.",
      obstruction: "Decoherence in traditional large-N quantum states.",
      strictification: "The FFZ-Clock relies on topological algebraic properties, making it naturally robust (transversal gates)."
    },
    experimentComponent: 'FFZClock'
  },
  {
    id: 'PHY-003',
    canonicalName: 'Cosmological Constant Problem',
    domain: 'Physics',
    description: "The massive (120 orders of magnitude) discrepancy between the observed vacuum energy of the universe and the value predicted by quantum field theory. A 'fine-tuning' problem of epic proportions.",
    mathematicalFormulation: '|ρ_vac_obs - ρ_vac_qft| ≈ 10^120',
    simplifiedMathExplanation: "The notation `10^120` represents a number with 120 zeros—an unfathomably large error. `ρ` (rho) is energy density. The equation shows the prediction is catastrophically larger than reality. FØZ fixes this by 'filtering out' the high-energy parts of the math that humans can't observe anyway.",
    fozInterpretation: {
      summary: "The discrepancy arises from summing unstable zero-point energies. FØZ treats the vacuum not as a single state, but as a net of virtual fluctuations. The FFZ-integral ∫_ffz d⁴k over these modes naturally cancels the high-energy contributions, mapping the divergent theoretical value to the small, stable observed value.",
      lambdaTermExample: "A regulator `exp(-k/M_ffz)` in the FFZ-integral, where `M_ffz` is a new fundamental scale.",
      obstruction: "The non-commutativity of the FFZ-integral with the limit k→∞ in the classical theory.",
      strictification: "The instability is strictified by postulating that the vacuum energy is fundamentally an FFZ-observable, meaning it must be well-behaved by definition."
    }
  },
  {
    id: 'PHY-004',
    canonicalName: 'The Hierarchy Problem',
    domain: 'Physics',
    description: "The question of why the Higgs boson's mass is so much lighter than the Planck mass, requiring an extreme and seemingly unnatural fine-tuning of parameters to protect it from huge quantum corrections.",
    mathematicalFormulation: "m_H² = m_bare² + δm_H² ≈ (10¹⁹ GeV)² - (10¹⁹ GeV)² ≈ (125 GeV)²",
    fozInterpretation: {
      summary: "The instability is a sensitivity to high-energy virtual particles. In FØZ, the Higgs mass is not a simple parameter but a fixed point of a renormalization group flow stabilized by an FFZ-Algebra. The algebra's structure creates a natural attractor at the electroweak scale, making the small mass a stable outcome, not a fine-tuned accident.",
      lambdaTermExample: "A non-linear stabilizer term `λ(m_H, M_Planck)` in the beta function for the Higgs mass.",
      obstruction: "A 'tadpole' diagram in QFT that represents a divergent self-energy correction.",
      strictification: "The fine-tuning is an illusion. The FFZ-stabilized path integral automatically discounts the unstable paths that would lead to a large Higgs mass."
    }
  },
  {
    id: 'PHY-005',
    canonicalName: 'Big Bang Singularity / Horizon Problem',
    domain: 'Physics',
    description: "The initial state of infinite density from which the universe began, and the related puzzle of why distant, causally disconnected regions of the universe are so uniform.",
    mathematicalFormulation: "a(t) → 0, ρ(t) → ∞ as t → 0",
    fozInterpretation: {
      summary: "The Big Bang singularity is treated identically to the Black Hole singularity: an unstable net. FØZ replaces it with a 'Planck Core' state `0s`. The Horizon Problem is resolved via FFZ-Homotopy, which establishes a pre-inflationary path-connectedness between all points in the initial state, ensuring thermal equilibrium without requiring causal contact in the classical sense.",
      lambdaTermExample: "The FRW metric `g_μν` becomes an FFZ-element, with `stab(a(t), ε)` preventing the scale factor `a(t)` from reaching zero.",
      obstruction: "The classical past light cones of two distant points in the CMB are disjoint.",
      strictification: "Causality itself is an emergent property. The initial FFZ state is 'a-causal' and its homotopy to a classical spacetime creates the causal structure we observe.",
      homotopyPath: "1. Initial state S0: A singular point with divergent temperature. \n2. Lift S0 to the 'Planck Core' algebra A_Planck. \n3. Evolution is a flow along the edges of the Torsion Graph G(A). \n4. The flow uniformly distributes information before the metric 'cools' (Strictification). \n5. Final state S_CMB: A smooth, causally connected manifold."
    }
  },
  {
    id: 'CS-003',
    canonicalName: 'The Halting Problem',
    domain: 'Computer Science',
    description: "The undecidable problem of determining, for an arbitrary program and input, whether the program will finish running or continue to run forever. A fundamental limit of computation.",
    mathematicalFormulation: "Halts(P, I) = {1 if P(I) halts, 0 otherwise} is not computable.",
    fozInterpretation: {
      summary: "FØZ approaches undecidability not as a binary property, but as a computational resource problem. Instead of asking 'if' a program halts, it asks 'what is the stabilized cost' of running it. A program that doesn't halt within a given computational budget `C` is assigned a non-trivial λ-term, indicating a 'computational obstruction' analogous to Russell's Paradox.",
      lambdaTermExample: "`λ(P, I, C)`, a term that grows as the execution time of `P(I)` exceeds the budget `C`.",
      obstruction: "The existence of Turing machines that cannot be proven to halt or not halt by any other Turing machine.",
      strictification: "Computability itself is graded. A problem is 'FFZ-computable' if its resource cost can be bounded and stabilized."
    }
  },
  {
    id: 'CS-ML-003',
    canonicalName: 'GAN Mode Collapse',
    domain: 'Machine Learning',
    description: "A common failure mode in training Generative Adversarial Networks, where the generator gets stuck producing only a few limited varieties of outputs, failing to capture the full diversity of the data.",
    mathematicalFormulation: "min_G max_D V(D,G) where G's output distribution p_g has low entropy.",
    fozInterpretation: {
      summary: "Mode collapse is a pathological fixed point in the two-player game's dynamics. FØZ introduces a 'diversity stabilizer' term to the Generator's loss function. This term, derived from an FFZ-measure of entropy, creates a 'repulsive force' in weight space, pushing the Generator away from low-entropy attractors and encouraging exploration of the full data manifold.",
      lambdaTermExample: "`L_G' = L_G - γ * stab(H(p_g), ε_H)`, where H is entropy and γ is a stabilizer strength.",
      obstruction: "A Nash Equilibrium where the Discriminator is easily fooled by a single, perfect-looking sample.",
      strictification: "The FØZ-GAN redefines the goal not as finding a Nash Equilibrium, but as finding a stabilized, high-entropy flow state between the two networks."
    }
  },
  {
    id: 'MATH-002',
    canonicalName: 'The Riemann Hypothesis',
    domain: 'Mathematics',
    description: "The famous conjecture about the location of the non-trivial zeros of the Riemann Zeta function, a problem deeply tied to the nature of prime numbers and infinity.",
    mathematicalFormulation: "ζ(s) = 0 ⇒ Re(s) = 1/2 for s ≠ -2, -4, ...",
    simplifiedMathExplanation: "The symbol `ζ(s)` represents an infinite sum. `Re(s) = 1/2` refers to a specific vertical line in the complex plane. The hypothesis claims all 'zeros' (roots) lie exactly on this line. FØZ views this line as a stable 'axis of symmetry'; any zero off this line would break the algebraic balance (symmetry) of the number system.",
    fozInterpretation: {
      summary: "The Hypothesis is reframed as a statement about the stability of a dynamical system. The zeros of the Zeta function are interpreted as equilibrium points of a 'Zeta Flow' on the complex plane. The FØZ analysis shows that all flow paths off the critical line `Re(s) = 1/2` are unstable under an FFZ-stabilized analytic continuation, proving they can never terminate at a zero.",
      lambdaTermExample: "The analytic continuation operator itself is replaced by a stabilized version `Cont_ffz`.",
      obstruction: "The chaotic and unpredictable distribution of prime numbers.",
      strictification: "The FØZ framework posits a 'deep symmetry' of the Zeta function that is only manifest in the FFZ-Algebra, where the critical line is a stable, attractive manifold."
    }
  },
  {
    id: 'MATH-003',
    canonicalName: 'The Continuum Hypothesis',
    domain: 'Mathematics',
    description: "The question of whether there exists a set whose 'size' is strictly between that of the integers and that of the real numbers. An instability in our understanding of the hierarchy of infinities.",
    mathematicalFormulation: "∄ S : ℵ₀ < |S| < 2^ℵ₀",
    simplifiedMathExplanation: "`ℵ₀` (Aleph-null) is the size of the integers (1, 2, 3...). `2^ℵ₀` is the size of the real numbers (decimals). The notation asks: Is there an infinity strictly *between* these two sizes? FØZ suggests this 'gap' is elastic—it depends on the 'resolution' (axioms) you use to measure it.",
    fozInterpretation: {
      summary: "The hypothesis's independence from ZFC is an instability in axiomatic systems. FØZ interprets cardinality not as a fixed value but as an 'FFZ-observable' that depends on the model of set theory. It proposes a homotopy path between models where the Continuum Hypothesis is true and models where it is false, showing that the 'size of the continuum' is a tunable, model-dependent parameter, not a fundamental constant.",
      lambdaTermExample: "The power set operation `P(S)` is replaced by a stabilized version `P_ffz(S, κ)` dependent on a 'model parameter' κ.",
      obstruction: "Gödel's and Cohen's independence proofs.",
      strictification: "There is no 'true' answer. The question itself is ill-posed without specifying an FFZ-model of the axioms.",
      homotopyPath: "1. Start with Model A (ZFC) where CH is Undecidable. \n2. Introduce FFZ-Parameter κ representing 'axiomatic resolution'. \n3. Vary κ along a path [0, 1]. \n4. At κ=0, the model forces CH = True (Constructible Universe L). \n5. At κ=1, the model forces CH = False (Cohen Forcing). \n6. The path proves the 'value' of the continuum size is a continuous function of the axioms."
    }
  },
  {
    id: 'MATH-004',
    canonicalName: 'Divergent Series',
    domain: 'Mathematics',
    description: "Infinite series that do not converge to a finite limit (e.g., 1 - 2 + 3 - 4 + ...). Assigning meaningful values to them requires sophisticated regularization techniques.",
    mathematicalFormulation: "Σ a_n → ∞ or oscillates. Example: Σ (-1)^n * n",
    simplifiedMathExplanation: "`Σ` means sum. `→ ∞` means the sum grows forever. `Oscillates` means it flips back and forth (e.g., 1, 0, 1, 0). Standard math breaks here. FØZ uses a 'smoothness' rule to assign a single, stable value to these unruly sums, effectively 'taming' the infinity.",
    fozInterpretation: {
      summary: "Divergence is an instability in the standard process of summation. FØZ replaces standard summation `Σ` with a stabilized summation operator `Σ_ffz`, which is equivalent to Cesàro or Abel summation but derived from first principles of FFZ-Algebra. This operator naturally assigns a finite, stable value (the 'FFZ-sum') to a large class of divergent series, treating them as well-behaved objects in the algebra.",
      lambdaTermExample: "`Σ_ffz a_n = lim_{ε→0} Σ a_n * exp(-n*ε)`. The `exp(-n*ε)` is the λ-term.",
      obstruction: "Violation of the Cauchy criterion for convergence.",
      strictification: "The notion of a 'sum' is generalized. Standard convergence is just one case (`ε=0`) of the more general, and more stable, FFZ-sum."
    },
    experimentComponent: 'FFZKernel'
  },
  {
    id: 'MATH-005',
    canonicalName: 'The Poincaré Conjecture (Resolved)',
    domain: 'Mathematics',
    description: "While solved by Grigori Perelman, the methods used (Ricci flow) are a form of geometric 'annealing' that smooths out instabilities in the topology of a manifold. It serves as a historical success story and a perfect target for an F0Z-Homotopy re-interpretation.",
    mathematicalFormulation: "Every simply connected, closed 3-manifold is homeomorphic to the 3-sphere.",
    fozInterpretation: {
      summary: "Perelman's Ricci Flow is recognized as a specific instance of a more general FFZ-Homotopy. The flow is a path on the space of metrics, driven by a 'geometric cost function' (the curvature). FØZ provides the algebraic language to show why this path is guaranteed to be stable and avoid singularities, effectively 'annealing' any initial topology into a simple sphere. It's a prime example of a solved instability via FØZ principles.",
      lambdaTermExample: "The Ricci Flow equation `∂g/∂t = -2Ric` is seen as a gradient descent on a stabilized FFZ-functional.",
      obstruction: "The formation of 'neck-pinch' singularities during the flow, which Perelman solved with 'surgery'.",
      strictification: "FØZ 'surgery' is an axiomatically-defined operation within the FFZ-Algebra of manifolds, making the process seamless.",
      homotopyPath: "1. Start with arbitrary manifold M (Unknown Topology). \n2. Apply Stabilized Ricci Flow (Heat Equation for Geometry). \n3. Singularities (Neck Pinches) are detected by λ-terms. \n4. Torsion Surgery removes singularities automatically. \n5. Flow converges to a collection of 3-spheres. \n6. Conclusion: M was homeomorphic to S3."
    }
  }
];
