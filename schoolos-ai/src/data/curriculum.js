// Curriculum content: subjects, chapters, a hand-written question bank, and preparation syllabi.
// This is the "school-approved knowledge base" the demo-mode AI draws from.

export const SUBJECTS = [
  { id: 'ENG', name: 'English', color: '#0072e5' },
  { id: 'MAT', name: 'Mathematics', color: '#d01858' },
  { id: 'SCI', name: 'Science', color: '#0d9488' },
  { id: 'SOC', name: 'Social Science', color: '#b45309' },
  { id: 'CSC', name: 'Computer Science', color: '#7c3aed' },
  { id: 'HIN', name: 'Hindi', color: '#c2410c' },
  { id: 'PHY', name: 'Physics', color: '#2563eb' },
  { id: 'CHE', name: 'Chemistry', color: '#059669' },
  { id: 'BIO', name: 'Biology', color: '#65a30d' },
];

export const classSubjects = (n) => (n <= 10 ? ['ENG', 'MAT', 'SCI', 'SOC', 'CSC', 'HIN'] : ['ENG', 'MAT', 'PHY', 'CHE', 'BIO', 'CSC']);

export const CHAPTERS = {
  ENG: ['Grammar: Tenses', 'Reading Comprehension', 'Letter and Essay Writing', 'Poetry Appreciation', 'Prose: Short Stories'],
  MAT: ['Number Systems', 'Algebra: Quadratic Equations', 'Geometry: Triangles', 'Trigonometry', 'Mensuration', 'Statistics and Probability'],
  SCI: ['Force and Motion', 'Chemical Reactions', 'Life Processes', 'Light and Optics', 'Electricity', 'Metals and Non-metals'],
  SOC: ['The French Revolution', 'Resources and Development', 'Democracy and the Constitution', 'Globalisation', 'Climate and Geography'],
  CSC: ['Python Basics', 'Data Structures', 'Databases and SQL', 'Networks and the Internet', 'Cyber Safety'],
  HIN: ['Vyakaran (Grammar)', 'Gadya Sankalan', 'Patra Lekhan', 'Kavya Khand', 'Anuchchhed Lekhan'],
  PHY: ['Mechanics', 'Electrostatics', 'Current Electricity', 'Optics', 'Thermodynamics', 'Modern Physics'],
  CHE: ['Atomic Structure', 'Periodic Table', 'Chemical Bonding', 'Organic Chemistry Basics', 'Chemical Kinetics', 'Electrochemistry'],
  BIO: ['Cell Structure', 'Genetics and Evolution', 'Human Physiology', 'Plant Physiology', 'Ecology'],
};

const Q = (q, o, a, e) => ({ q, o, a, e });

// Keyed "SUBJECT|Chapter". `kw` are keywords the demo tutor uses to recognise a question.
const BANK_RAW = {
  'MAT|Algebra: Quadratic Equations': {
    kw: ['quadratic', 'discriminant', 'roots', 'factoris', 'parabola'],
    concept:
      'A quadratic equation has the form ax² + bx + c = 0 with a ≠ 0. You can solve it by factorisation, by completing the square, or with the quadratic formula x = (−b ± √(b² − 4ac)) / 2a. The discriminant D = b² − 4ac tells you the nature of the roots: D > 0 gives two distinct real roots, D = 0 gives two equal real roots, and D < 0 gives no real roots.',
    simple:
      'Picture the equation as a U-shaped curve. The roots are the points where the curve crosses the ground (the x-axis). The discriminant is a quick check: positive means it crosses twice, zero means it just touches, negative means it floats above or below and never crosses.',
    mcqs: [
      Q('The roots of x² − 5x + 6 = 0 are', ['2 and 3', '−2 and −3', '1 and 6', '−1 and 6'], 0, 'x² − 5x + 6 = (x − 2)(x − 3), so x = 2 or 3.'),
      Q('The discriminant of 2x² + 3x + 5 = 0 is', ['−31', '49', '−11', '31'], 0, 'D = b² − 4ac = 9 − 40 = −31, which is negative, so there are no real roots.'),
      Q('If the discriminant of a quadratic equation is zero, the equation has', ['two distinct real roots', 'two equal real roots', 'no real roots', 'three roots'], 1, 'D = 0 means the two roots coincide.'),
      Q('The sum of the roots of x² − 7x + 12 = 0 is', ['12', '−7', '7', '−12'], 2, 'Sum of roots = −b/a = 7.'),
    ],
    short: ['State the quadratic formula and explain what the discriminant tells us.', 'Solve x² − 3x − 10 = 0 by factorisation. (Answer: x = 5 or x = −2)'],
  },
  'MAT|Trigonometry': {
    kw: ['trigonometr', 'sin', 'cos', 'tan', 'identity', 'elevation'],
    concept:
      'In a right triangle, sin θ = opposite/hypotenuse, cos θ = adjacent/hypotenuse and tan θ = opposite/adjacent. The key identity is sin²θ + cos²θ = 1. Standard values: sin 30° = 1/2, sin 45° = 1/√2, sin 60° = √3/2, tan 45° = 1.',
    simple: 'Trigonometry compares the sides of a right triangle. Remember SOH-CAH-TOA: Sine is Opposite over Hypotenuse, Cosine is Adjacent over Hypotenuse, Tangent is Opposite over Adjacent.',
    mcqs: [
      Q('sin 30° equals', ['1/2', '√3/2', '1', '1/√2'], 0, 'sin 30° = 1/2.'),
      Q('sin²θ + cos²θ equals', ['0', '1', 'tan θ', '2'], 1, 'This is the fundamental Pythagorean identity.'),
      Q('tan 45° equals', ['0', '1/2', '1', '√3'], 2, 'At 45° opposite and adjacent sides are equal.'),
      Q('If sin θ = 3/5 for an acute angle, cos θ equals', ['4/5', '3/4', '5/4', '2/5'], 0, 'cos θ = √(1 − 9/25) = 4/5.'),
    ],
    short: ['Prove that 1 + tan²θ = sec²θ.', 'The angle of elevation of a tower top is 45° from a point 20 m from its base. Find the height. (Answer: 20 m)'],
  },
  'MAT|Geometry: Triangles': {
    kw: ['triangle', 'similar', 'pythagoras', 'thales', 'proportionality'],
    concept:
      'Two triangles are similar when their corresponding angles are equal and corresponding sides are in proportion (AA, SSS or SAS similarity). The areas of similar triangles are in the ratio of the squares of corresponding sides. In a right triangle, hypotenuse² = base² + height².',
    simple: 'Similar triangles are the same shape in different sizes, like a photo and its enlargement. If one triangle is 2 times bigger in length, its area is 4 times bigger.',
    mcqs: [
      Q('The two shorter sides of a right triangle are 3 cm and 4 cm. The hypotenuse is', ['5 cm', '6 cm', '7 cm', '√7 cm'], 0, '3² + 4² = 25, so the hypotenuse is 5 cm.'),
      Q('Two similar triangles have sides in the ratio 2 : 3. The ratio of their areas is', ['2 : 3', '4 : 9', '8 : 27', '3 : 2'], 1, 'Area ratio = (2/3)² = 4/9.'),
      Q('Which of these is NOT a criterion for similarity of triangles?', ['AA', 'SSS', 'SAS', 'SSA'], 3, 'SSA does not guarantee similarity.'),
      Q('The sum of the interior angles of a triangle is', ['90°', '180°', '270°', '360°'], 1, 'The angle sum property.'),
    ],
    short: ['State the Basic Proportionality (Thales) theorem.', 'Prove that the sum of the angles of a triangle is 180°.'],
  },
  'MAT|Statistics and Probability': {
    kw: ['mean', 'median', 'mode', 'probability', 'average', 'statistics'],
    concept:
      'Mean = sum of observations ÷ number of observations. The median is the middle value of ordered data and the mode is the most frequent value. Probability of an event = favourable outcomes ÷ total outcomes, always between 0 and 1.',
    simple: 'Mean is the fair-share average, median is the middle person in a line sorted by height, and mode is the most popular value. Probability is just "how many ways I win" divided by "how many ways can happen".',
    mcqs: [
      Q('The mean of 2, 4, 6, 8, 10 is', ['5', '6', '7', '8'], 1, '30 ÷ 5 = 6.'),
      Q('A fair die is rolled. The probability of an even number is', ['1/6', '1/3', '1/2', '2/3'], 2, 'Three of the six faces are even.'),
      Q('The median of 3, 9, 5, 7, 1 is', ['3', '5', '7', '9'], 1, 'Sorted: 1, 3, 5, 7, 9. The middle value is 5.'),
      Q('The probability of a sure event is', ['0', '1/2', '1', '2'], 2, 'A sure event always happens.'),
    ],
    short: ['Differentiate between mean, median and mode.', 'Find the probability of drawing a red card from a standard deck of 52 cards. (Answer: 1/2)'],
  },
  'SCI|Force and Motion': {
    kw: ['newton', 'force', 'inertia', 'acceleration', 'motion', 'momentum'],
    concept:
      "Newton's first law: an object stays at rest or in uniform motion unless an unbalanced force acts on it. Second law: F = ma. Third law: every action has an equal and opposite reaction. Speed = distance ÷ time and acceleration = change in velocity ÷ time.",
    simple: 'Things like to keep doing what they are already doing (inertia). A bigger push gives a bigger change in motion (F = ma). And when you push something, it pushes back equally.',
    mcqs: [
      Q('The SI unit of force is', ['joule', 'newton', 'watt', 'pascal'], 1, 'Named after Isaac Newton.'),
      Q('A 2 kg object accelerates at 3 m/s². The net force on it is', ['1.5 N', '5 N', '6 N', '9 N'], 2, 'F = ma = 2 × 3 = 6 N.'),
      Q('Which law explains why passengers lurch forward when a bus brakes suddenly?', ['First law (inertia)', 'Second law', 'Third law', 'Law of gravitation'], 0, 'Their bodies tend to continue moving.'),
      Q('A rocket rises as hot gases rush downward. This illustrates', ['First law', 'Second law', 'Third law', 'Conservation of energy'], 2, 'Action and reaction.'),
    ],
    short: ['Define inertia and give two everyday examples.', 'A car speeds up from 10 m/s to 30 m/s in 5 s. Find its acceleration. (Answer: 4 m/s²)'],
  },
  'SCI|Chemical Reactions': {
    kw: ['reaction', 'balanc', 'reactant', 'product', 'oxidation', 'displacement', 'combination'],
    concept:
      'In a chemical reaction the reactants change into products. Atoms are rearranged but the total mass is conserved, so chemical equations must be balanced. Common types are combination, decomposition, displacement, double displacement and oxidation–reduction.',
    simple: 'A chemical reaction is like rebuilding a LEGO set into a new model. You use exactly the same bricks (atoms), just arranged differently, so you must end with the same count of each brick.',
    mcqs: [
      Q('2H₂ + O₂ → 2H₂O is an example of a', ['decomposition reaction', 'combination reaction', 'displacement reaction', 'double displacement reaction'], 1, 'Two substances combine to form one.'),
      Q('Rusting of iron is', ['a physical change', 'an oxidation reaction', 'a nuclear reaction', 'a neutralisation'], 1, 'Iron reacts with oxygen and moisture.'),
      Q('Which law states that mass is neither created nor destroyed in a chemical reaction?', ['Law of definite proportions', 'Law of conservation of mass', "Avogadro's law", "Boyle's law"], 1, 'This is why equations are balanced.'),
      Q('Zn + CuSO₄ → ZnSO₄ + Cu is a', ['combination reaction', 'decomposition reaction', 'displacement reaction', 'neutralisation'], 2, 'Zinc displaces copper from its salt.'),
    ],
    short: ['Balance the equation: Fe + H₂O → Fe₃O₄ + H₂. (Answer: 3Fe + 4H₂O → Fe₃O₄ + 4H₂)', 'Differentiate between combination and decomposition reactions.'],
  },
  'SCI|Life Processes': {
    kw: ['respiration', 'digest', 'nutrition', 'circulat', 'excretion', 'haemoglobin', 'kidney', 'blood'],
    concept:
      'Life processes include nutrition, respiration, transport and excretion. Food is digested in the alimentary canal and absorbed mainly in the small intestine. Haemoglobin in red blood cells carries oxygen, the heart pumps blood through a double circulation, and the kidneys filter blood to remove nitrogenous waste.',
    simple: 'Your body is a factory: the gut breaks down fuel, the lungs bring in oxygen, the blood is the delivery system, and the kidneys take out the rubbish.',
    mcqs: [
      Q('Which pigment carries oxygen in human blood?', ['Chlorophyll', 'Haemoglobin', 'Melanin', 'Insulin'], 1, 'Haemoglobin is in red blood cells.'),
      Q('Most absorption of digested food takes place in the', ['stomach', 'small intestine', 'large intestine', 'liver'], 1, 'Villi increase the surface area.'),
      Q('The functional unit of the kidney is the', ['neuron', 'nephron', 'alveolus', 'villus'], 1, 'Each kidney has about a million nephrons.'),
      Q('Breakdown of glucose without oxygen in muscles produces', ['ethanol', 'lactic acid', 'acetic acid', 'citric acid'], 1, 'This causes muscle cramps after heavy exercise.'),
    ],
    short: ['Differentiate between aerobic and anaerobic respiration.', 'Describe the path of blood in the double circulation of humans.'],
  },
  'SCI|Electricity': {
    alias: 'PHY|Current Electricity',
    kw: ['ohm', 'resistance', 'current', 'voltage', 'circuit', 'electric'],
    concept:
      "Ohm's law: V = IR at constant temperature. Resistors in series add (R = R₁ + R₂); in parallel 1/R = 1/R₁ + 1/R₂. Electric power P = VI = I²R and energy used E = P × t.",
    simple: 'Voltage is the push, current is the flow and resistance is how hard it is for the flow to get through. More push means more flow; more resistance means less flow.',
    mcqs: [
      Q('A 6 V battery drives a current of 2 A through a resistor. Its resistance is', ['3 Ω', '12 Ω', '4 Ω', '0.33 Ω'], 0, 'R = V/I = 6/2 = 3 Ω.'),
      Q('Two 4 Ω resistors connected in series give', ['2 Ω', '4 Ω', '8 Ω', '16 Ω'], 2, 'Series resistances add.'),
      Q('Two 4 Ω resistors connected in parallel give', ['2 Ω', '4 Ω', '8 Ω', '0.5 Ω'], 0, '1/R = 1/4 + 1/4 = 1/2.'),
      Q('A 100 W bulb runs for 2 hours. The energy used is', ['0.2 kWh', '0.5 kWh', '2 kWh', '200 kWh'], 0, '0.1 kW × 2 h = 0.2 kWh.'),
    ],
    short: ["State Ohm's law and sketch the V–I graph.", 'Why are household appliances connected in parallel?'],
  },
  'SCI|Light and Optics': {
    alias: 'PHY|Optics',
    kw: ['light', 'reflection', 'refraction', 'mirror', 'lens', 'optic', 'snell'],
    concept:
      'Light travels in straight lines at about 3 × 10⁸ m/s in vacuum. Laws of reflection: the angle of incidence equals the angle of reflection. Refraction follows Snell’s law, n = sin i / sin r. A concave mirror converges rays, and the lens formula is 1/v − 1/u = 1/f.',
    simple: 'Light bounces off shiny surfaces (reflection) and bends when it moves between materials such as air and water (refraction). That bending is why a straw looks broken in a glass of water.',
    mcqs: [
      Q('The speed of light in vacuum is approximately', ['3 × 10⁸ m/s', '3 × 10⁶ m/s', '3 × 10⁵ m/s', '3 × 10¹⁰ m/s'], 0, 'About 300,000 km/s.'),
      Q('The image formed by a plane mirror is', ['real and inverted', 'virtual and erect', 'real and erect', 'virtual and inverted'], 1, 'It appears behind the mirror and cannot be projected.'),
      Q('The focal length of a concave mirror with radius of curvature 20 cm is', ['5 cm', '10 cm', '20 cm', '40 cm'], 1, 'f = R/2.'),
      Q('Total internal reflection can occur when light travels from', ['a rarer to a denser medium', 'a denser to a rarer medium at an angle greater than the critical angle', 'air to glass', 'vacuum to air'], 1, 'Both conditions are needed.'),
    ],
    short: ['State the laws of reflection of light.', 'Explain why a pencil appears bent in a glass of water.'],
  },
  'PHY|Mechanics': {
    kw: ['kinematic', 'momentum', 'kinetic energy', 'work', 'projectile', 'velocity', 'acceleration'],
    concept:
      'For uniform acceleration: v = u + at, s = ut + ½at² and v² = u² + 2as. Momentum p = mv is conserved when no external force acts. Work W = Fd cos θ, kinetic energy = ½mv² and potential energy = mgh.',
    simple: 'Mechanics asks: where is something, how fast is it going, and what pushes it? The three kinematic equations connect distance, speed, time and acceleration so you can find any one if you know the others.',
    mcqs: [
      Q('A body starts from rest with acceleration 2 m/s². The distance covered in 5 s is', ['10 m', '25 m', '50 m', '5 m'], 1, 's = ½at² = ½ × 2 × 25 = 25 m.'),
      Q('The kinetic energy of a 2 kg body moving at 3 m/s is', ['3 J', '6 J', '9 J', '18 J'], 2, '½ × 2 × 9 = 9 J.'),
      Q('The momentum of a 5 kg mass moving at 4 m/s is', ['9 kg m/s', '1.25 kg m/s', '20 kg m/s', '80 kg m/s'], 2, 'p = mv = 20.'),
      Q('At the highest point of its flight, a ball thrown vertically upward has', ['maximum velocity', 'zero velocity', 'maximum acceleration', 'zero acceleration'], 1, 'It momentarily stops; gravity still acts.'),
    ],
    short: ['Derive v² = u² + 2as.', 'State the law of conservation of linear momentum.'],
  },
  'PHY|Current Electricity': { alias: 'SCI|Electricity' },
  'PHY|Optics': { alias: 'SCI|Light and Optics' },
  'CHE|Periodic Table': {
    kw: ['periodic', 'group', 'period', 'electronegativity', 'atomic radius', 'alkali'],
    concept:
      'In the modern periodic table elements are arranged by increasing atomic number into 18 groups and 7 periods. Across a period atomic radius decreases and electronegativity increases. Down a group atomic radius and metallic character increase.',
    simple: 'The periodic table is a seating chart for the elements. Neighbours in the same column behave alike because they have the same number of outer electrons.',
    mcqs: [
      Q('Elements in the same group have the same number of', ['electron shells', 'valence electrons', 'protons', 'neutrons'], 1, 'This is why they have similar properties.'),
      Q('Across a period from left to right, atomic radius generally', ['increases', 'decreases', 'stays the same', 'first increases then decreases'], 1, 'Increasing nuclear charge pulls electrons closer.'),
      Q('The most electronegative element is', ['oxygen', 'chlorine', 'fluorine', 'nitrogen'], 2, 'Fluorine on the Pauling scale: 3.98.'),
      Q('Alkali metals belong to group', ['1', '2', '17', '18'], 0, 'Li, Na, K, Rb, Cs, Fr.'),
    ],
    short: ['State the modern periodic law.', 'Why does atomic size increase down a group?'],
  },
  'CHE|Atomic Structure': {
    kw: ['atom', 'electron', 'proton', 'neutron', 'isotope', 'bohr', 'rutherford', 'nucleus'],
    concept:
      'An atom has a nucleus of protons and neutrons with electrons in shells around it. The atomic number Z is the number of protons and the mass number A = protons + neutrons. In Bohr’s model electrons occupy fixed energy levels, filling shells in the order 2, 8, 8 for lighter elements.',
    simple: 'An atom is like a tiny solar system: a dense nucleus in the middle with electrons orbiting around. What element it is depends only on the number of protons.',
    mcqs: [
      Q('The number of neutrons in a sodium atom ²³Na₁₁ is', ['11', '12', '23', '34'], 1, '23 − 11 = 12.'),
      Q('The nucleus of the atom was discovered by', ['Thomson', 'Rutherford', 'Bohr', 'Chadwick'], 1, 'Gold-foil scattering experiment.'),
      Q('The electronic configuration of sodium (Z = 11) is', ['2, 8, 1', '2, 8, 8', '2, 9', '2, 7, 2'], 0, '2 + 8 + 1 = 11.'),
      Q('Isotopes of an element have the same number of', ['neutrons', 'protons', 'mass number', 'nucleons'], 1, 'They differ only in neutrons.'),
    ],
    short: ['Distinguish between isotopes and isobars.', 'State the limitations of Rutherford’s model of the atom.'],
  },
  'BIO|Cell Structure': {
    kw: ['cell', 'mitochondria', 'nucleus', 'ribosome', 'organelle', 'membrane', 'chloroplast'],
    concept:
      'The cell is the basic unit of life. Plant cells have a cell wall, chloroplasts and a large vacuole; animal cells do not. Mitochondria release energy, the nucleus holds the genetic material, ribosomes make proteins and the Golgi apparatus packages them.',
    simple: 'A cell is a tiny city. The nucleus is city hall, mitochondria are power plants, ribosomes are factories and the membrane is the border control.',
    mcqs: [
      Q('The powerhouse of the cell is the', ['nucleus', 'mitochondrion', 'ribosome', 'Golgi body'], 1, 'It produces most of the cell’s ATP.'),
      Q('Which of these is found only in plant cells?', ['mitochondria', 'cell wall', 'ribosomes', 'nucleus'], 1, 'Made of cellulose.'),
      Q('The site of protein synthesis is the', ['ribosome', 'lysosome', 'vacuole', 'centriole'], 0, 'Ribosomes translate mRNA into protein.'),
      Q('The fluid mosaic model describes the structure of the', ['nucleus', 'cell membrane', 'chloroplast', 'mitochondrion'], 1, 'Proteins float in a phospholipid bilayer.'),
    ],
    short: ['List three differences between plant and animal cells.', 'State the function of lysosomes.'],
  },
  'BIO|Genetics and Evolution': {
    kw: ['mendel', 'gene', 'dna', 'allele', 'evolution', 'inherit', 'monohybrid', 'mutation'],
    concept:
      'Mendel’s laws describe inheritance: dominance, segregation and independent assortment. A monohybrid cross Tt × Tt gives a 3 : 1 phenotypic ratio and a 1 : 2 : 1 genotypic ratio. DNA carries genetic information; mutations create variation on which natural selection acts.',
    simple: 'You get one version of each gene from each parent. A dominant version hides the recessive one, which is why traits can skip a generation.',
    mcqs: [
      Q('The phenotypic ratio of a monohybrid cross Tt × Tt is', ['1 : 1', '3 : 1', '9 : 3 : 3 : 1', '1 : 2 : 1'], 1, 'Three tall to one dwarf.'),
      Q('The “father of genetics” is', ['Darwin', 'Mendel', 'Lamarck', 'Watson'], 1, 'He worked on pea plants.'),
      Q('DNA nucleotides contain a sugar, a phosphate and a', ['amino acid', 'nitrogenous base', 'fatty acid', 'vitamin'], 1, 'A, T, G or C.'),
      Q('The theory of natural selection was proposed by', ['Mendel', 'Darwin', 'Haeckel', 'Pasteur'], 1, 'In “On the Origin of Species”.'),
    ],
    short: ['Explain the law of segregation.', 'How does mutation contribute to evolution?'],
  },
  'ENG|Grammar: Tenses': {
    kw: ['tense', 'grammar', 'past', 'present', 'future', 'perfect', 'continuous'],
    concept:
      'Tenses show time. Simple present: she writes. Present continuous: she is writing. Present perfect: she has written. Simple past: she wrote. Past perfect: she had written. Simple future: she will write.',
    simple: 'Tenses are time stamps for verbs. Ask two questions: when did it happen (past, present, future), and is it finished, ongoing or habitual?',
    mcqs: [
      Q('Choose the correct sentence.', ['She have finished her work.', 'She has finished her work.', 'She finish her work.', 'She finishing her work.'], 1, 'Singular subject takes “has”.'),
      Q('In “They were playing when it rained”, “were playing” is in the', ['past continuous tense', 'present continuous tense', 'past perfect tense', 'simple past tense'], 0, 'Was/were + verb-ing.'),
      Q('Fill in the blank: By the time we arrived, the film ___.', ['starts', 'had started', 'will start', 'is starting'], 1, 'An earlier past action needs the past perfect.'),
      Q('The future perfect form of “complete” is', ['will complete', 'will have completed', 'has completed', 'would complete'], 1, 'will have + past participle.'),
    ],
    short: ['Rewrite in the passive voice: The teacher corrected the exam papers.', 'Give one example each of the present perfect and the past perfect tense.'],
  },
  'CSC|Python Basics': {
    kw: ['python', 'variable', 'loop', 'function', 'list', 'print', 'program', 'code'],
    concept:
      'Python is an interpreted language. Variables store values, e.g. x = 5. Core types are int, float, str, bool, list and dict. Control flow uses if/elif/else, for and while. Functions are defined with def and can return values.',
    simple: 'Python reads like English. You give names to values (variables), repeat actions with loops, and wrap reusable steps inside functions.',
    mcqs: [
      Q('What is the output of print(type(3.5))?', ["<class 'int'>", "<class 'float'>", "<class 'str'>", "<class 'bool'>"], 1, '3.5 is a floating-point number.'),
      Q('What does len([1, 2, 3, 4]) return?', ['3', '4', '5', 'Error'], 1, 'It counts the items.'),
      Q('Which keyword is used to define a function in Python?', ['func', 'define', 'def', 'function'], 2, 'def name(parameters):'),
      Q('What is the output of print(2 ** 3)?', ['6', '8', '9', '23'], 1, '** is the exponent operator.'),
    ],
    short: ['Write a Python program to print the sum of the first 10 natural numbers. (Answer: 55)', 'Differentiate between a list and a tuple.'],
  },
  'CSC|Data Structures': {
    kw: ['stack', 'queue', 'lifo', 'fifo', 'array', 'linked list', 'data structure'],
    concept:
      'A stack follows Last-In-First-Out (LIFO) with push and pop. A queue follows First-In-First-Out (FIFO) with enqueue and dequeue. Arrays give constant-time indexed access, while linked lists make insertion and deletion cheap.',
    simple: 'A stack is a pile of plates: you take the one you put on last. A queue is a line at the canteen: the first person in line is served first.',
    mcqs: [
      Q('Which data structure follows the LIFO principle?', ['Queue', 'Stack', 'Array', 'Tree'], 1, 'Last in, first out.'),
      Q('Insertion in a queue is called', ['push', 'pop', 'enqueue', 'dequeue'], 2, 'Elements join at the rear.'),
      Q('Elements 1, 2, 3 are pushed onto a stack in that order. The first pop returns', ['1', '2', '3', 'Error'], 2, 'The last element pushed is on top.'),
      Q('Which operation removes an item from the front of a queue?', ['push', 'dequeue', 'peek', 'pop'], 1, 'FIFO removal.'),
    ],
    short: ['Explain one real-life use of a stack.', 'Differentiate between a stack and a queue.'],
  },
};

/** Resolve aliases so lookups work from either subject's chapter name. */
export function getBank(subjectId, chapter) {
  let e = BANK_RAW[`${subjectId}|${chapter}`];
  if (e?.alias) e = { ...BANK_RAW[e.alias], ...e, alias: undefined };
  return e && e.mcqs ? e : null;
}
export const bankKeys = () =>
  Object.keys(BANK_RAW)
    .filter((k) => getBank(...k.split('|')))
    .map((k) => {
      const [subjectId, chapter] = k.split('|');
      return { subjectId, chapter };
    });
export function findBankByText(text, subjectId) {
  const t = text.toLowerCase();
  let best = null;
  let bestScore = 0;
  for (const { subjectId: sid, chapter } of bankKeys()) {
    if (subjectId && sid !== subjectId) continue;
    const b = getBank(sid, chapter);
    let score = 0;
    for (const k of b.kw || []) if (t.includes(k)) score += 2;
    for (const w of chapter.toLowerCase().split(/\W+/)) if (w.length > 4 && t.includes(w)) score += 1;
    if (score > bestScore) {
      bestScore = score;
      best = { subjectId: sid, chapter };
    }
  }
  return best;
}

// Preparation syllabi (topic keys are `${subjectId}|${topic}`)
export const PREP_TRACKS = {
  BOARD: { label: 'Board Examinations', desc: 'Class-wise board exam syllabus with revision and error tracking.' },
  JEE: { label: 'JEE (Engineering)', desc: 'Physics, Chemistry and Mathematics preparation.' },
  NEET: { label: 'NEET (Medical)', desc: 'Physics, Chemistry and Biology preparation.' },
};
export function prepSyllabus(track, classNo = 10) {
  if (track === 'JEE')
    return [
      { subjectId: 'PHY', topics: ['Mechanics', 'Electrostatics', 'Current Electricity', 'Magnetism', 'Optics', 'Thermodynamics', 'Waves', 'Modern Physics'] },
      { subjectId: 'CHE', topics: ['Atomic Structure', 'Periodic Table', 'Chemical Bonding', 'Thermodynamics', 'Equilibrium', 'Electrochemistry', 'Organic Chemistry Basics', 'Coordination Compounds'] },
      { subjectId: 'MAT', topics: ['Sets and Functions', 'Algebra: Quadratic Equations', 'Sequences and Series', 'Limits and Derivatives', 'Integrals', 'Vectors', 'Statistics and Probability', 'Coordinate Geometry'] },
    ];
  if (track === 'NEET')
    return [
      { subjectId: 'PHY', topics: ['Mechanics', 'Current Electricity', 'Optics', 'Thermodynamics', 'Modern Physics'] },
      { subjectId: 'CHE', topics: ['Atomic Structure', 'Periodic Table', 'Chemical Bonding', 'Organic Chemistry Basics', 'Chemical Kinetics'] },
      { subjectId: 'BIO', topics: ['Cell Structure', 'Genetics and Evolution', 'Human Physiology', 'Plant Physiology', 'Ecology', 'Reproduction', 'Biotechnology'] },
    ];
  return classSubjects(classNo).map((subjectId) => ({ subjectId, topics: CHAPTERS[subjectId] }));
}
