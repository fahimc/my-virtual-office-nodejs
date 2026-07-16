const sharedSource = 'Reusable luxury editorial component system adapted from the user-provided private assets reference; all category content and compositions are original.';

export const premiumTemplateCatalog = [
  premiumTemplate({
    id: 'luxury-private-assets',
    category: 'real-estate',
    imagerySourceId: 'property-showcase',
    mode: 'property',
    paletteId: 'sage-stone-architecture',
    fontGroupId: 'urbanist-libre',
    title: 'Private Assets Editorial',
    client: 'Aurelis',
    badge: 'Private property',
    headline: 'Exceptional property, represented with discretion.',
    subhead: 'A private property practice for exceptional homes, discreet opportunities, and considered decisions.',
    cta: 'Request a private viewing',
    secondary: 'Explore selected properties',
    palette: ['#151611', '#f2efe7', '#a89262'],
    metrics: [['Private', 'off-market search'], ['Global', 'trusted network'], ['1:1', 'principal advice']],
    sections: ['Practice', 'Properties', 'Services', 'Process', 'Private access'],
    matchKeywords: ['property', 'properties', 'real estate', 'estate agent', 'realtor', 'residence', 'residential', 'home developer', 'house builder', 'private asset'],
    config: {
      brandSuffix: 'Property',
      pageTitle: 'Aurelis - Private Property Advisory',
      heroFootLink: 'Discover the practice',
      tickerItems: ['Private acquisition', 'Residential sales', 'Property advisory', 'Development', 'International search'],
      introEyebrow: 'The practice',
      introStatement: 'A private property practice for clients who value access, judgement, and precise representation.',
      assetsEyebrow: 'Selected property',
      assetsHeading: 'Places of consequence.',
      servicesEyebrow: 'Property services',
      servicesHeading: 'One relationship. Complete alignment.',
      cinematicStatement: 'The finest properties are not simply found. They are understood.',
      principlesHeading: 'Quietly connected. Entirely client-side.',
      audienceEyebrow: 'Who we advise',
      audienceHeading: 'Built around principals, not listings.',
      privateHeading: 'Selected opportunities, shared in confidence.',
      footerLine: 'Discretion - Independence - Judgement',
      theme: {
        ink: '#151611', inkSoft: '#292a24', paper: '#f2efe7', paperAlt: '#e8e3d8', stone: '#cbc3b4', gold: '#a89262', white: '#ffffff'
      }
    }
  }),
  premiumTemplate({
    id: 'luxury-hospitality-retreat',
    category: 'real-estate',
    imagerySourceId: 'reference-interior-split-panel',
    mode: 'luxury',
    paletteId: 'ruby-cream-hospitality',
    fontGroupId: 'playfair-source-sans',
    title: 'Private Retreat Journal',
    client: 'Morrow House',
    badge: 'Boutique hospitality',
    headline: 'A slower rhythm, held in remarkable places.',
    subhead: 'A secluded country retreat where thoughtful rooms, landscape, food, and restorative rituals belong to one unhurried stay.',
    cta: 'Plan your stay',
    secondary: 'Explore the house',
    palette: ['#17231c', '#f2efe5', '#b18b4d'],
    metrics: [['18', 'individual rooms'], ['140', 'private acres'], ['All year', 'seasonal stays']],
    sections: ['The house', 'Stays', 'Experiences', 'Your journey', 'Reservations'],
    matchKeywords: ['hotel', 'hospitality', 'resort', 'retreat', 'lodge', 'guest house', 'country house', 'private members'],
    config: {
      brandSuffix: 'Country retreat',
      pageTitle: 'Morrow House - A Private Country Retreat',
      navItems: [
        { label: 'The house', target: 'practice' }, { label: 'Stays', target: 'sections' }, { label: 'Experiences', target: 'services' }, { label: 'Your journey', target: 'process' }
      ],
      locationLine: 'The Cotswolds, England',
      heroFootLink: 'Enter the house',
      tickerItems: ['Private stays', 'Field-to-table dining', 'Woodland bathing', 'House gatherings', 'Seasonal rituals'],
      introEyebrow: 'A place apart',
      introStatement: 'Some stays are remembered by what happened. The best are remembered by how they made time feel.',
      introCopy: [
        'Morrow House is a private retreat shaped by the landscape: quiet rooms, long lunches, open fires, and paths that begin at the door.',
        'Every detail is considered, while the experience remains personal and instinctive. Arrive with a plan or let the house set the pace.'
      ],
      assetsEyebrow: 'Ways to stay',
      assetsHeading: 'Your own way into the landscape.',
      assetsIntro: 'Choose a room in the house, a garden suite, or exclusive use for a gathering. Each stay includes a personal host and an itinerary shaped around you.',
      assets: [
        { meta: 'The house - Twelve rooms', title: 'Rooms with a sense of place', alt: 'Calm boutique hotel bedroom overlooking the landscape' },
        { meta: 'The garden - Six suites', title: 'Private garden suites', alt: 'Private garden suite with natural materials' },
        { meta: 'Exclusive use - By request', title: 'A house of your own', alt: 'Country house prepared for a private gathering' }
      ],
      servicesEyebrow: 'The experience',
      servicesHeading: 'Everything considered. Nothing over-arranged.',
      servicesIntro: 'The house team shapes each stay around appetite, energy, weather, and occasion.',
      services: [
        { title: 'Stay well', description: 'Quiet rooms, generous baths, considered sleep rituals, and a host who knows when to help and when to disappear.' },
        { title: 'Eat with the seasons', description: 'Menus led by the kitchen garden, trusted local producers, and the simple pleasure of choosing where to dine.' },
        { title: 'Restore your rhythm', description: 'Guided movement, woodland bathing, treatment rituals, and open time without a timetable.' },
        { title: 'Gather privately', description: 'Exclusive-use stays for families, celebrations, and small teams, coordinated from arrival to last breakfast.' }
      ],
      cinematicEyebrow: 'The Morrow feeling',
      cinematicStatement: 'The rarest luxury is time that feels entirely your own.',
      cinematicCopy: 'Rooms, food, landscape, and service work quietly together so the stay feels effortless rather than programmed.',
      practiceImageAlt: 'Natural interior at Morrow House',
      principlesEyebrow: 'The house philosophy',
      principlesHeading: 'Rooted in place. Generous in spirit.',
      principlesIntro: 'Good hospitality is precise behind the scenes and natural everywhere else.',
      principles: [
        { title: 'Local', description: 'Food, materials, and experiences begin with the surrounding landscape.' },
        { title: 'Personal', description: 'Every stay is shaped around the people arriving, never a fixed package.' },
        { title: 'Restorative', description: 'Space, pace, light, and sound are considered as carefully as service.' },
        { title: 'Responsible', description: 'The house protects its setting through seasonal sourcing and low-impact operations.' }
      ],
      audienceEyebrow: 'Come as you are',
      audienceHeading: 'For quiet escapes and meaningful gatherings.',
      audiences: [
        { title: 'Two of you', description: 'A private few days built around sleep, food, landscape, and uninterrupted time together.' },
        { title: 'Family and friends', description: 'Flexible rooms, shared tables, and thoughtful experiences for different generations.' },
        { title: 'Private gatherings', description: 'Exclusive use for celebrations and leadership retreats with one host coordinating every detail.' }
      ],
      processEyebrow: 'Plan your stay',
      processHeading: 'A simple route to somewhere exceptional.',
      processIntro: 'Tell us who is travelling and what would make the stay matter. We will shape the rest with you.',
      processSteps: [
        { title: 'Share your dates', description: 'Tell us the occasion, party size, and the pace you have in mind.' },
        { title: 'Choose your space', description: 'We recommend the right rooms, suites, or exclusive-use arrangement.' },
        { title: 'Shape the stay', description: 'Dining, treatments, walks, and moments are composed around your priorities.' },
        { title: 'Arrive', description: 'Your host takes care of the details while you settle into the house.' }
      ],
      privateEyebrow: 'Seasonal stays',
      privateHeading: 'Come for the landscape. Leave with a different sense of time.',
      privateCopy: 'Selected dates, whole-house gatherings, and seasonal experiences are shared first with our private list.',
      contactEyebrow: 'Reservations',
      contactHeading: 'Begin planning your stay.',
      contactIntro: 'Share your preferred dates and what brings you to Morrow House. Our reservations host will respond personally.',
      contactResponse: 'Reservations host response within one day',
      formInterestLabel: 'Type of stay',
      formOtherOption: 'Something more personal',
      formMessageLabel: 'What would make this stay special?',
      formSubmitLabel: 'Request availability',
      formSuccessMessage: 'Thank you. Our reservations host will be in touch shortly.',
      footerLine: 'Stay - Gather - Restore',
      theme: {
        ink: '#17231c', inkSoft: '#26362c', paper: '#f2efe5', paperAlt: '#e5e0d2', stone: '#c4bca8', gold: '#b18b4d', white: '#ffffff'
      }
    }
  }),
  premiumTemplate({
    id: 'luxury-architecture-practice',
    category: 'real-estate',
    imagerySourceId: 'reference-architecture-strip',
    mode: 'luxury',
    paletteId: 'sage-stone-architecture',
    fontGroupId: 'instrument-sans-serif',
    title: 'Material Architecture Practice',
    client: 'Studio Noma',
    badge: 'Architecture and interiors',
    headline: 'Spaces shaped by light, material, and how people live.',
    subhead: 'An architecture and interior design practice creating enduring homes, hospitality, and cultural spaces from first study to final detail.',
    cta: 'Discuss a project',
    secondary: 'View selected work',
    palette: ['#171818', '#f1f0ec', '#b48958'],
    metrics: [['24', 'completed places'], ['9', 'active regions'], ['RIBA', 'chartered practice']],
    sections: ['Studio', 'Projects', 'Disciplines', 'Method', 'Contact'],
    matchKeywords: ['architecture', 'architect', 'interior design', 'interior studio', 'spatial design', 'built environment'],
    config: {
      brandSuffix: 'Architecture',
      pageTitle: 'Studio Noma - Architecture and Interiors',
      navItems: [
        { label: 'Studio', target: 'practice' }, { label: 'Projects', target: 'sections' }, { label: 'Disciplines', target: 'services' }, { label: 'Method', target: 'process' }
      ],
      locationLine: 'London - Copenhagen - Projects worldwide',
      heroFootLink: 'Read our approach',
      tickerItems: ['Architecture', 'Interior design', 'Adaptive reuse', 'Hospitality', 'Furniture and detail'],
      introEyebrow: 'The studio',
      introStatement: 'We make places that feel inevitable: clear in idea, exact in detail, and richer with time.',
      introCopy: [
        'Studio Noma works across architecture, interiors, and objects, giving every project one coherent spatial language.',
        'Research begins with context and use. Design develops through proportion, material testing, daylight, and close collaboration with makers.'
      ],
      assetsEyebrow: 'Selected work',
      assetsHeading: 'Built for place, purpose, and permanence.',
      assetsIntro: 'A selection of residential, hospitality, and adaptive-reuse work. Full project studies and technical scopes are available to prospective clients.',
      assets: [
        { meta: 'Residential - Hampstead', title: 'Courtyard House', alt: 'Contemporary courtyard residence by Studio Noma' },
        { meta: 'Hospitality - Copenhagen', title: 'Harbour Rooms', alt: 'Material-led boutique hospitality interior' },
        { meta: 'Adaptive reuse - Lisbon', title: 'Foundry Arts', alt: 'Converted industrial building used as an arts space' }
      ],
      servicesEyebrow: 'Disciplines',
      servicesHeading: 'One design language, from site to handle.',
      servicesIntro: 'A senior studio team stays close from feasibility through construction and completion.',
      services: [
        { title: 'Architecture', description: 'Feasibility, concept, planning, technical design, and construction-stage oversight for new and existing buildings.' },
        { title: 'Interior architecture', description: 'Spatial planning, material systems, lighting intent, joinery, and integrated interior detailing.' },
        { title: 'Adaptive reuse', description: 'Careful transformation of existing structures, balancing heritage, performance, and contemporary use.' },
        { title: 'Objects and furniture', description: 'Bespoke furniture, fittings, and material details that complete the architecture rather than decorate it.' }
      ],
      cinematicEyebrow: 'Design principle',
      cinematicStatement: 'A building should belong to its place before it belongs to a style.',
      cinematicCopy: 'Context is not a visual reference. It is climate, craft, movement, memory, and the everyday rituals a building must support.',
      practiceImageAlt: 'Architectural material study and model',
      principlesEyebrow: 'How we work',
      principlesHeading: 'Rigorous enough to build. Human enough to inhabit.',
      principlesIntro: 'The strongest ideas survive contact with budgets, regulations, weather, making, and daily life.',
      principles: [
        { title: 'Context', description: 'Site, climate, history, and use establish the project logic.' },
        { title: 'Proportion', description: 'Plans and sections are resolved through movement, daylight, and human scale.' },
        { title: 'Material', description: 'Assemblies are tested for performance, tactility, ageing, and repair.' },
        { title: 'Continuity', description: 'The same senior design team remains involved from first study to completion.' }
      ],
      audienceEyebrow: 'Project types',
      audienceHeading: 'Private, public, and hospitality spaces with lasting purpose.',
      audiences: [
        { title: 'Private homes', description: 'New-build, renovation, and sensitive extension projects shaped around how clients genuinely live.' },
        { title: 'Hospitality', description: 'Distinctive guest experiences where architecture, interior, service, and operations align.' },
        { title: 'Cultural work', description: 'Galleries, workplaces, and adaptive-reuse projects that create new public value from existing fabric.' }
      ],
      processEyebrow: 'Project method',
      processHeading: 'From open questions to exact decisions.',
      processIntro: 'Each stage reduces uncertainty while preserving the central idea and the qualities that matter most.',
      processSteps: [
        { title: 'Brief and site', description: 'We test ambitions, constraints, planning context, budget, programme, and opportunities.' },
        { title: 'Concept', description: 'Plans, sections, massing, and material direction establish one legible design proposition.' },
        { title: 'Development', description: 'Consultants, approvals, performance, details, and costs are coordinated into a buildable whole.' },
        { title: 'Construction', description: 'Design intent is protected through site review, samples, responses, and close collaboration with makers.' },
        { title: 'Completion', description: 'Final details, handover, and post-occupancy learning close the loop.' }
      ],
      privateEyebrow: 'Project archive',
      privateHeading: 'See the thinking behind the finished space.',
      privateCopy: 'Detailed project books, drawings, material studies, and relevant technical case studies are available for prospective commissions.',
      contactEyebrow: 'New projects',
      contactHeading: 'Tell us what you are considering.',
      contactIntro: 'Share the site, ambition, approximate programme, and where you are in the process. A director will respond personally.',
      contactResponse: 'Director response within two business days',
      formInterestLabel: 'Project type',
      formOtherOption: 'Research or collaboration',
      formMessageLabel: 'Project outline',
      formSubmitLabel: 'Send project enquiry',
      formSuccessMessage: 'Thank you. A studio director will review your project and respond shortly.',
      footerLine: 'Architecture - Interiors - Objects',
      theme: {
        ink: '#171818', inkSoft: '#2b2d2d', paper: '#f1f0ec', paperAlt: '#dedfd9', stone: '#bfc4c0', gold: '#b48958', white: '#ffffff'
      }
    }
  }),
  premiumTemplate({
    id: 'luxury-private-wealth',
    category: 'agency',
    imagerySourceId: 'agency-premium-system',
    mode: 'luxury',
    paletteId: 'silver-fintech',
    fontGroupId: 'dm-sans-newsreader',
    title: 'Private Wealth Stewardship',
    client: 'North & Vale',
    badge: 'Independent family office',
    headline: 'Clarity across capital, family, and time.',
    subhead: 'An independent family office helping principals organise complex wealth, coordinate trusted advisers, and make long-horizon decisions with confidence.',
    cta: 'Arrange an introduction',
    secondary: 'Explore our approach',
    palette: ['#101b2b', '#f3f0e8', '#b4955a'],
    metrics: [['Independent', 'advice'], ['Multi-gen', 'perspective'], ['Private', 'by design']],
    sections: ['Perspective', 'Mandates', 'Capabilities', 'Process', 'Introduction'],
    matchKeywords: ['family office', 'private wealth', 'wealth management', 'investment office', 'principal office', 'financial advisory', 'wealth adviser'],
    config: {
      brandSuffix: 'Family office',
      pageTitle: 'North & Vale - Independent Family Office',
      navItems: [
        { label: 'Perspective', target: 'practice' }, { label: 'Mandates', target: 'sections' }, { label: 'Capabilities', target: 'services' }, { label: 'Working together', target: 'process' }
      ],
      locationLine: 'London - Geneva - International families',
      heroFootLink: 'Our perspective',
      tickerItems: ['Wealth strategy', 'Family governance', 'Consolidated reporting', 'Private investments', 'Adviser coordination'],
      introEyebrow: 'Our perspective',
      introStatement: 'Complex wealth becomes more useful when decisions, information, and relationships are organised around a shared direction.',
      introCopy: [
        'North & Vale gives families an independent centre of gravity across investments, structures, reporting, governance, and trusted specialists.',
        'We do not replace every adviser. We create the clarity, evidence, and coordination that help the right advisers work as one.'
      ],
      assetsEyebrow: 'Representative mandates',
      assetsHeading: 'Different moments. One long view.',
      assetsIntro: 'Our work is private. These mandate types illustrate how we help families create structure before complexity becomes friction.',
      assets: [
        { meta: 'Founder transition - Multi-jurisdiction', title: 'From liquidity to long-term purpose', alt: 'Private wealth principals in a confidential meeting' },
        { meta: 'Next generation - Governance', title: 'A framework for shared decisions', alt: 'Family representatives discussing long-term plans' },
        { meta: 'Family office - Consolidation', title: 'One view across every adviser', alt: 'Independent advisers reviewing consolidated information' }
      ],
      servicesEyebrow: 'Capabilities',
      servicesHeading: 'Independent thinking. Coordinated execution.',
      servicesIntro: 'Work begins with what the family needs to decide, not with a product or predefined structure.',
      services: [
        { title: 'Wealth architecture', description: 'Objectives, entities, liquidity, risk, and decision rights mapped into one practical family framework.' },
        { title: 'Investment oversight', description: 'Independent policy, manager coordination, portfolio evidence, and decision support across advisers and custodians.' },
        { title: 'Family governance', description: 'Forums, principles, education, and succession processes that make complex family decisions more constructive.' },
        { title: 'Office coordination', description: 'Consolidated reporting, specialist selection, project oversight, and one accountable point across the wider network.' }
      ],
      cinematicEyebrow: 'Stewardship',
      cinematicStatement: 'The purpose of wealth is not merely to endure. It is to remain useful.',
      cinematicCopy: 'Good stewardship connects capital with family priorities, real-world responsibilities, and the freedom to act when opportunity appears.',
      practiceImageAlt: 'Private family office discussion',
      principlesEyebrow: 'Independent by structure',
      principlesHeading: 'Evidence before opinion. Purpose before product.',
      principlesIntro: 'A deliberately conflict-aware model keeps the family mandate at the centre of every recommendation.',
      principles: [
        { title: 'Independence', description: 'Advice is not tied to a house product, transaction, or preferred provider.' },
        { title: 'Confidentiality', description: 'Information access is controlled, proportionate, and designed around family governance.' },
        { title: 'Evidence', description: 'Important decisions are supported by clear assumptions, alternatives, costs, and consequences.' },
        { title: 'Continuity', description: 'Institutional memory is preserved across generations, advisers, and major transitions.' }
      ],
      audienceEyebrow: 'Who we advise',
      audienceHeading: 'Built for principals facing consequential decisions.',
      audiences: [
        { title: 'Founders', description: 'Structure and decision support before and after liquidity, succession, or a significant shift in family complexity.' },
        { title: 'Families', description: 'A coherent operating framework across generations, investments, advisers, entities, and shared priorities.' },
        { title: 'Trustees and advisers', description: 'An independent coordination partner who strengthens the wider team without duplicating specialist roles.' }
      ],
      processEyebrow: 'Working together',
      processHeading: 'Start with the decisions that matter.',
      processIntro: 'The relationship develops in clear stages, allowing trust and useful evidence to build before the mandate expands.',
      processSteps: [
        { title: 'Confidential introduction', description: 'We understand the family context, immediate questions, and existing adviser landscape.' },
        { title: 'Diagnostic', description: 'Structures, information, responsibilities, risks, and decision gaps are mapped without disrupting current work.' },
        { title: 'Priorities', description: 'A sequenced agenda focuses effort on the decisions with the greatest consequence or urgency.' },
        { title: 'Coordination', description: 'Specialists, reporting, and implementation are brought into one accountable rhythm.' },
        { title: 'Stewardship', description: 'The framework evolves as the family, opportunities, and responsibilities change.' }
      ],
      privateEyebrow: 'Confidential perspective',
      privateHeading: 'A useful first conversation requires no commitment.',
      privateCopy: 'We can begin with one decision, one transition, or one area of complexity before defining a broader family office mandate.',
      contactEyebrow: 'Private introduction',
      contactHeading: 'Begin in confidence.',
      contactIntro: 'Share only the context needed to arrange an appropriate introduction. A principal will respond directly.',
      contactResponse: 'Principal response within one business day',
      formInterestLabel: 'Area of focus',
      formOtherOption: 'Confidential family matter',
      formMessageLabel: 'Context for the introduction',
      formSubmitLabel: 'Request an introduction',
      formSuccessMessage: 'Thank you. A principal will respond to arrange a confidential introduction.',
      footerLine: 'Clarity - Independence - Stewardship',
      theme: {
        ink: '#101b2b', inkSoft: '#203047', paper: '#f3f0e8', paperAlt: '#e4e0d6', stone: '#c2b9aa', gold: '#b4955a', white: '#ffffff'
      }
    }
  }),
  premiumTemplate({
    id: 'luxury-wellness-sanctuary',
    category: 'healthcare',
    imagerySourceId: 'clinic-calm-care',
    mode: 'luxury',
    paletteId: 'rose-quartz-care',
    fontGroupId: 'dm-sans-newsreader',
    title: 'Integrative Wellness Sanctuary',
    client: 'Serein',
    badge: 'Integrative health',
    headline: 'Feel understood before you are ever treated.',
    subhead: 'A private integrative health practice combining thoughtful clinical review, restorative therapies, and a clear plan built around the whole person.',
    cta: 'Request a consultation',
    secondary: 'Explore the approach',
    palette: ['#20342f', '#f3f0e7', '#b78c65'],
    metrics: [['1:1', 'clinical attention'], ['Whole', 'person review'], ['Ongoing', 'care continuity']],
    sections: ['Philosophy', 'Programmes', 'Care team', 'Your path', 'Consultation'],
    matchKeywords: ['wellness', 'wellbeing', 'integrative health', 'private clinic', 'health retreat', 'longevity', 'spa', 'therapeutic'],
    config: {
      brandSuffix: 'Integrative health',
      pageTitle: 'Serein - Private Integrative Health',
      navItems: [
        { label: 'Philosophy', target: 'practice' }, { label: 'Programmes', target: 'sections' }, { label: 'Care', target: 'services' }, { label: 'Your path', target: 'process' }
      ],
      locationLine: 'Harley Street, London - Online consultations',
      heroFootLink: 'Our care philosophy',
      tickerItems: ['Clinical review', 'Restorative therapy', 'Movement', 'Nutrition', 'Long-term wellbeing'],
      introEyebrow: 'Care philosophy',
      introStatement: 'Better care begins with enough time to understand what is happening, what matters, and what sustainable progress looks like for you.',
      introCopy: [
        'Serein brings clinical perspective, lifestyle context, and restorative practice into one coherent personal care plan.',
        'The experience is calm and unhurried, with clear explanations, appropriate referrals, and one team maintaining continuity.'
      ],
      assetsEyebrow: 'Ways we can help',
      assetsHeading: 'Care designed around the person, not the appointment.',
      assetsIntro: 'Programmes begin with a thorough consultation and are adapted to individual needs. Recommendations remain evidence-aware and within each practitioner\'s scope.',
      assets: [
        { meta: 'Foundations - Personal review', title: 'Health clarity consultation', alt: 'Calm private health consultation' },
        { meta: 'Restore - Guided programme', title: 'Energy and recovery', alt: 'Restorative wellness treatment environment' },
        { meta: 'Continue - Ongoing care', title: 'Long-term wellbeing', alt: 'Personal movement and wellbeing session' }
      ],
      servicesEyebrow: 'The care model',
      servicesHeading: 'A coordinated view of your wellbeing.',
      servicesIntro: 'Each discipline contributes to one practical plan, with clinical boundaries and referral needs made clear.',
      services: [
        { title: 'Clinical review', description: 'A detailed health history, current concerns, goals, and relevant evidence considered in an unhurried consultation.' },
        { title: 'Restorative therapies', description: 'Appropriate hands-on and recovery-focused therapies selected around comfort, function, and agreed goals.' },
        { title: 'Movement and nutrition', description: 'Practical routines designed for real schedules, current capacity, and sustainable progress.' },
        { title: 'Care continuity', description: 'Follow-up, progress review, specialist coordination, and plan refinement through one consistent relationship.' }
      ],
      cinematicEyebrow: 'Our belief',
      cinematicStatement: 'Care should make you feel clearer, not more overwhelmed.',
      cinematicCopy: 'Every recommendation is explained, prioritised, and connected to a realistic next step, so the plan remains useful outside the clinic.',
      practiceImageAlt: 'Quiet treatment room with natural materials',
      principlesEyebrow: 'Care standards',
      principlesHeading: 'Calm in experience. Rigorous in responsibility.',
      principlesIntro: 'A premium environment never replaces sound professional boundaries, informed consent, and transparent care.',
      principles: [
        { title: 'Listen first', description: 'Enough time is protected to understand concerns, context, and personal goals.' },
        { title: 'Explain clearly', description: 'Options, limitations, costs, and next steps are discussed in straightforward language.' },
        { title: 'Coordinate carefully', description: 'Practitioners collaborate appropriately and refer when needs sit outside their scope.' },
        { title: 'Review honestly', description: 'Progress is assessed against meaningful outcomes and the plan changes when evidence requires it.' }
      ],
      audienceEyebrow: 'When Serein may help',
      audienceHeading: 'For people seeking clarity, recovery, and a more sustainable rhythm.',
      audiences: [
        { title: 'A fresh perspective', description: 'For complex or persistent concerns where a longer, contextual review would be useful.' },
        { title: 'Recovery and reset', description: 'For demanding periods, post-treatment recovery, or a structured return to stronger routines.' },
        { title: 'Long-term wellbeing', description: 'For people who value continuity, prevention-aware habits, and a coordinated care relationship.' }
      ],
      processEyebrow: 'Your path',
      processHeading: 'Unhurried at the start. Clear at every step.',
      processIntro: 'We establish fit first, then build only the level of care that is appropriate and useful.',
      processSteps: [
        { title: 'Private enquiry', description: 'Share your priorities and any practical requirements for the first consultation.' },
        { title: 'Initial consultation', description: 'A practitioner reviews history, concerns, goals, and relevant existing information.' },
        { title: 'Personal plan', description: 'Recommendations are prioritised with clear rationale, timing, and expected review points.' },
        { title: 'Care and review', description: 'Progress is monitored, the plan is refined, and referrals are coordinated where appropriate.' }
      ],
      privateEyebrow: 'First consultation',
      privateHeading: 'Begin with space to be heard.',
      privateCopy: 'Our care coordinator can help identify the most appropriate practitioner and consultation format before any booking is made.',
      contactEyebrow: 'Private consultation',
      contactHeading: 'Tell us what support you are looking for.',
      contactIntro: 'Please avoid sending sensitive medical details through this form. Our care coordinator will arrange a secure next step.',
      contactResponse: 'Care coordinator response within one business day',
      formInterestLabel: 'Type of support',
      formOtherOption: 'Not sure yet',
      formMessageLabel: 'Brief reason for your enquiry',
      formPrivacyNote: 'Do not include urgent or sensitive medical information. This service is not for emergencies.',
      formSubmitLabel: 'Request a consultation',
      formSuccessMessage: 'Thank you. Our care coordinator will contact you to arrange the right next step.',
      footerLine: 'Listen - Understand - Restore',
      theme: {
        ink: '#20342f', inkSoft: '#355047', paper: '#f3f0e7', paperAlt: '#e2e8df', stone: '#b9c8bd', gold: '#b78c65', white: '#ffffff'
      }
    }
  }),
  premiumTemplate({
    id: 'luxury-jewellery-atelier',
    category: 'ecommerce',
    imagerySourceId: 'awarded-cinematic-luxury',
    mode: 'luxury',
    paletteId: 'mocha-mousse-studio',
    fontGroupId: 'playfair-source-sans',
    title: 'Jewellery Atelier Edition',
    client: 'Maison Orra',
    badge: 'Fine jewellery atelier',
    headline: 'Made once. Carried for generations.',
    subhead: 'A private jewellery atelier creating one-of-one pieces through exceptional stones, restrained design, and a deeply personal commission process.',
    cta: 'Begin a commission',
    secondary: 'View the signatures',
    palette: ['#25171b', '#f6f0e8', '#c09a62'],
    metrics: [['One of one', 'private pieces'], ['Traceable', 'selected stones'], ['Lifetime', 'atelier care']],
    sections: ['Maison', 'Signatures', 'Atelier', 'Commission', 'Private appointment'],
    matchKeywords: ['jewellery', 'jewelry', 'atelier', 'fine jewellery', 'watch', 'watches', 'couture', 'luxury fashion', 'leather goods'],
    config: {
      brandSuffix: 'Fine jewellery',
      pageTitle: 'Maison Orra - Fine Jewellery Atelier',
      navItems: [
        { label: 'Maison', target: 'practice' }, { label: 'Signatures', target: 'sections' }, { label: 'Atelier', target: 'services' }, { label: 'Commission', target: 'process' }
      ],
      locationLine: 'London - Paris - Private appointments',
      heroFootLink: 'Enter the maison',
      tickerItems: ['High jewellery', 'Private commissions', 'Exceptional stones', 'Atelier craft', 'Lifetime care'],
      introEyebrow: 'The maison',
      introStatement: 'Jewellery becomes personal when proportion, material, and meaning are resolved into something that could belong to no one else.',
      introCopy: [
        'Maison Orra works privately with collectors and families to create singular pieces with a quiet, unmistakable character.',
        'Every commission begins with conversation and develops through drawing, stone selection, handwork, and patient refinement in the atelier.'
      ],
      assetsEyebrow: 'Signature language',
      assetsHeading: 'Light, line, and exceptional material.',
      assetsIntro: 'These signatures express the maison\'s design language. Each private piece is developed individually rather than reproduced from a catalogue.',
      assets: [
        { meta: 'High jewellery - One of one', title: 'The Orra line', alt: 'Sculptural fine jewellery piece in an atelier setting' },
        { meta: 'Exceptional stones - Private sourcing', title: 'Colour with character', alt: 'Exceptional coloured gemstone selected for a private commission' },
        { meta: 'Heirloom renewal - Atelier', title: 'A new chapter', alt: 'Heritage jewellery carefully reimagined by an artisan' }
      ],
      servicesEyebrow: 'Inside the atelier',
      servicesHeading: 'Private service, exacting craft.',
      servicesIntro: 'Design, sourcing, making, and long-term care are held within one trusted maison relationship.',
      services: [
        { title: 'Private commissions', description: 'A one-of-one design developed around the wearer, occasion, material preferences, and desired legacy.' },
        { title: 'Stone curation', description: 'A selective search for stones with the right origin, character, proportion, and documented qualities.' },
        { title: 'Heirloom renewal', description: 'Sensitive redesign and restoration that respects provenance while creating a piece for the next chapter.' },
        { title: 'Atelier care', description: 'Cleaning, inspection, adjustment, documentation, and future stewardship across the life of the piece.' }
      ],
      cinematicEyebrow: 'The Orra standard',
      cinematicStatement: 'Rarity is not a number. It is the feeling that nothing else would do.',
      cinematicCopy: 'The right piece holds tension between restraint and presence, preciousness and personality, tradition and the hand of its time.',
      practiceImageAlt: 'Jewellery artisan working by hand at a bench',
      principlesEyebrow: 'Materials and making',
      principlesHeading: 'Every detail earns its place.',
      principlesIntro: 'Beauty must be supported by integrity in sourcing, engineering, comfort, documentation, and care.',
      principles: [
        { title: 'Provenance', description: 'Materials are selected with attention to origin, documentation, quality, and character.' },
        { title: 'Proportion', description: 'Scale, balance, setting, and movement are resolved around the wearer.' },
        { title: 'Handwork', description: 'Skilled makers shape, set, finish, and inspect each piece through exacting atelier practice.' },
        { title: 'Longevity', description: 'Construction and care are considered for decades of wear and future stewardship.' }
      ],
      audienceEyebrow: 'Private clients',
      audienceHeading: 'For moments, collections, and legacies that deserve their own form.',
      audiences: [
        { title: 'A personal milestone', description: 'A singular piece created to hold the meaning of an engagement, anniversary, achievement, or new beginning.' },
        { title: 'The considered collector', description: 'Distinct stones and original compositions selected for design merit, character, and long-term relevance.' },
        { title: 'Family heirlooms', description: 'Sensitive restoration or reinvention that preserves history while making the piece wearable now.' }
      ],
      processEyebrow: 'The commission',
      processHeading: 'Personal from first thought to final fitting.',
      processIntro: 'The process allows time for trust, material discovery, and exact decisions without making the experience feel technical.',
      processSteps: [
        { title: 'Private appointment', description: 'We discuss the person, meaning, preferences, timeframe, and parameters of the commission.' },
        { title: 'Design study', description: 'Drawings, references, proportions, and stone directions establish the central idea.' },
        { title: 'Material selection', description: 'Stones and metals are presented with clear documentation and considered recommendations.' },
        { title: 'Atelier making', description: 'The piece is engineered, made, set, finished, and inspected by specialist hands.' },
        { title: 'Presentation and care', description: 'A final fitting, documentation, and lifetime care plan complete the commission.' }
      ],
      privateEyebrow: 'Private viewing',
      privateHeading: 'Discover stones and signatures not shown publicly.',
      privateCopy: 'Exceptional stones, one-of-one studies, and selected completed pieces are available to view during a private appointment.',
      contactEyebrow: 'Private appointment',
      contactHeading: 'Begin with what the piece should mean.',
      contactIntro: 'Share the occasion, timeframe, and any initial thoughts. A client director will arrange a discreet conversation.',
      contactResponse: 'Client director response within one business day',
      formInterestLabel: 'Type of appointment',
      formOtherOption: 'A private question',
      formMessageLabel: 'Tell us about the commission',
      formSubmitLabel: 'Request an appointment',
      formSuccessMessage: 'Thank you. A client director will contact you to arrange your private appointment.',
      footerLine: 'Material - Meaning - Handwork',
      theme: {
        ink: '#25171b', inkSoft: '#3b252b', paper: '#f6f0e8', paperAlt: '#e9ddd2', stone: '#ccb8ad', gold: '#c09a62', white: '#ffffff'
      }
    }
  })
];

export function premiumTemplateForBrief(value) {
  const text = normalizeMatchText(value);
  let best;
  let bestScore = 0;
  for (const template of premiumTemplateCatalog) {
    const score = template.matchKeywords.reduce((total, keyword) => total + (text.includes(normalizeMatchText(keyword)) ? keyword.length : 0), 0);
    if (score > bestScore) {
      best = template;
      bestScore = score;
    }
  }
  return best;
}

export function premiumTemplateConfigForBrief(value, brand) {
  const template = premiumTemplateForBrief(value);
  if (!template) return undefined;
  const clientBrand = String(brand || '').trim();
  return {
    template,
    config: clientBrand ? replaceText(template.luxuryConfig, template.client, clientBrand) : template.luxuryConfig
  };
}

function premiumTemplate(definition) {
  return {
    category: 'agency',
    theme: 'agency-preview',
    referenceInspired: true,
    referenceSource: sharedSource,
    templateFamily: 'luxuryPropertyTemplate',
    heroPattern: 'premium-editorial-system',
    images: definition.images || premiumImages(definition.id),
    inspiration: ['private assets editorial system', 'high-end service storytelling', 'cinematic full-bleed imagery', 'DaisyUI accessible primitives'],
    ...definition,
    luxuryMode: definition.mode,
    luxuryConfig: definition.config
  };
}

function premiumImages(templateId) {
  return Array.from(
    { length: 8 },
    (_, index) => `/template-gallery/premium-assets/${templateId}/asset-${String(index + 1).padStart(2, '0')}.webp`
  );
}

function normalizeMatchText(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function replaceText(value, source, replacement) {
  if (typeof value === 'string') return value.replaceAll(source, replacement);
  if (Array.isArray(value)) return value.map(item => replaceText(item, source, replacement));
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, replaceText(item, source, replacement)]));
  }
  return value;
}
