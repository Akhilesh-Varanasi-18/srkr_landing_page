// SRKR Landing Page — Team Members Data
const teamData = [
    {
        id: 'bobby',
        name: 'Veerabadhra Bobby',
        role: 'Team Manager · AWS & DevOps Specialist',
        tagline: 'AWS Cloud, DevOps & GPU Infrastructure Specialist',
        photo: '/assets/images/srkr/project-images/team/Bobby_Devops_Engineer_and_Team_Manager_uniform.png',
        linkedin: 'https://www.linkedin.com/in/bobbypamarthi/',
        portfolio: '/portfolios/bobby.html',
        accentColor: 'var(--srkr-primary)',
        accentBg: 'var(--srkr-bg-coral-tint)',
        tags: ['AWS DevOps', 'NVIDIA DGX GPU', 'Claude Architect', 'Cisco CCNA', 'Solutions Architect'],
        highlights: [
            '5+ years of Industry Experience as AWS DevOps Engineer',
            'Hands-on Experience with NVIDIA DGX Spark GPU Infrastructure',
            'Claude Certified Architect',
            'Cisco Certified Network Associate (CCNA)',
            'AWS Certified Cloud Practitioner & AWS Certified Solutions Architect'
        ]
    },
    {
        id: 'akhilesh',
        name: 'Akhilesh Varanasi',
        role: 'Full Stack & AI Architect',
        tagline: 'MERN Stack Developer & Generative AI Builder',
        photo: '/assets/images/srkr/project-images/team/Akhilesh_Varanasi_FullStack_Developer_uniform.png',
        linkedin: 'https://www.linkedin.com/in/akhilesh-varanasi-6b2bb3286/',
        portfolio: '/portfolios/akhilesh.html',
        accentColor: 'var(--srkr-secondary)',
        accentBg: 'var(--srkr-bg-warm-tint)',
        tags: ['MERN Stack', 'Generative AI', 'LLM Workflows', 'Claude Architect', 'ServiceNow CAD', 'DSA (C++/Python)'],
        highlights: [
            'Full Stack MERN Developer with hands-on expertise in React.js, Node.js, Express.js, and MongoDB',
            'AI & LLM Builder with practical experience in Generative AI, Prompt Engineering, LLM Workflows & AI applications',
            'Claude Certified Architect – Foundations, demonstrating expertise in modern enterprise AI solutions',
            'ServiceNow Certified System Administrator (CSA) and Certified Application Developer (CAD)',
            'Strong C++ and Python Programmer with deep expertise in Data Structures, Algorithms & Problem Solving',
            'Experience building real-world scalable web applications, combining MERN + GenAI to create intelligent products'
        ]
    },
    {
        id: 'rahul',
        name: 'R. Rahul Varma',
        role: 'Flutter Developer & CP Specialist',
        tagline: 'Mobile Engineer & Competitive Programmer',
        photo: '/assets/images/srkr/project-images/team/Rahul_Flutter_Developer_uniform.png',
        linkedin: 'https://www.linkedin.com/in/rahulvarmarudraraju/',
        portfolio: '/portfolios/rahul.html',
        accentColor: 'var(--srkr-tertiary)',
        accentBg: 'var(--srkr-bg-warm-offwhite)',
        tags: ['Flutter SDK', 'Dart', 'LeetCode Top 20%', 'CodeChef 1700+', 'C++/Java/Python'],
        highlights: [
            'Built HooT, with 10K+ downloads',
            'Built the MYNA app, now live with 1K+ downloads',
            'Competitive Programmer with expertise in C++, Java, Python, and C',
            'LeetCode Global Top 20% — LeetCode Cap Holder',
            '1700+ rating in Data Structures & Algorithms on CodeChef'
        ]
    },
    {
        id: 'chaitanya',
        name: 'K. Chaitanya',
        role: 'Flutter Developer & CP Knight',
        tagline: 'Cross-Platform Mobile Developer & Competitive Coder',
        photo: '/assets/images/srkr/project-images/team/Chaitanya_Flutter_Developer_uniform.png',
        linkedin: 'https://www.linkedin.com/in/k-k-n-d-chaitanya/',
        portfolio: '/portfolios/chaitanya.html',
        accentColor: 'var(--srkr-secondary)',
        accentBg: 'var(--srkr-bg-warm-tint)',
        tags: ['Flutter SDK', 'Dart OOP', 'LeetCode Knight (Top 6%)', 'CodeChef 1650+', 'Algorithm Design'],
        highlights: [
            'Built HooT, with 10K+ downloads',
            'Built the MYNA app, now live with 1K+ downloads',
            'Competitive Programmer with expertise in C++, Java, Python, and C',
            'LeetCode Global Top 6% — LeetCode Knight',
            '1650+ rating in Data Structures & Algorithms on CodeChef'
        ]
    },
    {
        id: 'manikanta',
        name: 'Manikanta',
        role: 'ServiceNow Developer',
        tagline: 'Enterprise Platform Automation & Workflow Specialist',
        photo: '/assets/images/srkr/project-images/team/Manikanta_ServiceNow_Developer_uniform.png',
        linkedin: 'https://www.linkedin.com/in/manikanta-srighakollapu/',
        portfolio: '/portfolios/manikanta.html',
        accentColor: 'var(--srkr-primary)',
        accentBg: 'var(--srkr-bg-coral-tint)',
        tags: ['ServiceNow CAD', 'Now Platform', 'GlideRecord', 'Flow Designer', 'IntegrationHub'],
        highlights: [
            'ServiceNow Developer with deep expertise in Now Platform enterprise architecture',
            'Hands-on experience in GlideRecord scripting, Business Rules, Client Scripts & UI Policies',
            'Specialized in Flow Designer, Process Automation & IntegrationHub REST APIs',
            'Expertise in CSA & CAD certification mentoring and enterprise workflow engineering',
            'Passionate technical mentor guiding students into high-growth enterprise platform roles'
        ]
    },
    {
        id: 'abhilash',
        name: 'Anala Abhilash',
        role: 'Power BI & Snowflake Developer',
        tagline: 'Building automated Power BI dashboards & reporting solutions that drive smarter, faster decisions',
        photo: '/assets/images/srkr/project-images/team/Abhilash_PowerBI_Snowflake_Developer_uniform.png',
        linkedin: 'https://www.linkedin.com/in/anala-abhilash/',
        portfolio: '/portfolios/abhilash.html',
        accentColor: 'var(--srkr-secondary)',
        accentBg: 'var(--srkr-bg-warm-tint)',
        tags: ['Power BI', 'Snowflake', 'SQL & DAX', 'Power Platform', 'Data Modeling'],
        highlights: [
            'Data Analyst with 3+ years turning complex operational data into actionable dashboards',
            'Core toolkit spans Power BI, SQL, Snowflake, Excel & the Microsoft Power Platform',
            'Designs star-schema data models with advanced DAX & Power Query transformations',
            'Delivered 50+ end-to-end BI solutions processing 300K+ records',
            'Holds 5 global certifications across Microsoft, Oracle & Snowflake; trained 700+ students'
        ]
    },
    {
        id: 'azarunnisa',
        name: 'Mohammad Azarunnisa',
        role: 'Salesforce & ServiceNow Developer',
        tagline: 'Enterprise Salesforce CRM enablement & ServiceNow ITSM platform specialist',
        photo: '/assets/images/srkr/project-images/team/Azarunnisa_Salesforce_ServiceNow_Developer_uniform.png',
        linkedin: 'https://www.linkedin.com/in/mohammad-azarunnisa/',
        portfolio: '/portfolios/azarunnisa.html',
        accentColor: 'var(--srkr-tertiary)',
        accentBg: 'var(--srkr-bg-warm-offwhite)',
        tags: ['Salesforce CRM', 'ServiceNow ITSM', 'CSA & CAD', 'Salesforce Admin', 'Flow Configuration'],
        highlights: [
            'Salesforce & ServiceNow specialist with hands-on enterprise platform experience',
            'Holds ServiceNow CSA & CAD plus Salesforce Administrator & AI Associate certifications',
            'Trained 100+ ServiceNow trainees (95+ certified) and 70+ Salesforce trainees',
            '4-Star Ranger on Salesforce Trailhead with 246,000+ points',
            'Claude Certified Architect with 350+ CodeChef problems solved'
        ]
    },
    {
        id: 'prasanth',
        name: 'Prasanth Kedarisetti',
        role: 'Full Stack Developer & Team Lead',
        tagline: '10+ years building Web, Mobile, AI & AR/VR products and leading engineering teams',
        photo: '/assets/images/srkr/project-images/team/Prasanth_FullStack_Developer_uniform.png',
        linkedin: 'https://www.linkedin.com/in/prasanth-kedarisetti/',
        portfolio: '/portfolios/prasanth.html',
        accentColor: 'var(--srkr-primary)',
        accentBg: 'var(--srkr-bg-coral-tint)',
        tags: ['MERN Stack', 'Unity (C#)', 'AR / VR', 'PHP', 'Project Management'],
        highlights: [
            'Project Manager (IT) with 10+ years of software engineering leadership',
            'Full Stack (MERN), Unity C#, AR/VR & PHP expert — built 16+ enterprise products',
            'Led 40+ cognitive games, public AR spectacles & Dockerized online compilers',
            'Delivered nationwide trainings in Full Stack, Unity, AR & VR development',
            '3× Best Developer of the Year & Unity Certified Associate'
        ]
    },
    {
        id: 'sampath',
        name: 'Sampath Rayi',
        role: 'ServiceNow Developer & Trainer',
        tagline: 'Training ServiceNow professionals while shipping real-world ITSM & automation projects',
        photo: '/assets/images/srkr/project-images/team/Sampath_ServiceNow_Developer_uniform.png',
        linkedin: 'https://www.linkedin.com/in/sampathrayi/',
        portfolio: '/portfolios/sampath.html',
        accentColor: 'var(--srkr-secondary)',
        accentBg: 'var(--srkr-bg-warm-tint)',
        tags: ['ServiceNow CSA', 'ServiceNow CAD', 'ITSM', 'Java & SQL', 'Power BI'],
        highlights: [
            'ServiceNow Trainer & IT graduate with 2+ years in ITSM & automation',
            'Trained 600+ students in ServiceNow, lifting average assessment scores by 25%',
            'Built Service Hub campus ticketing portal serving 1,000+ students, cutting response times 40%',
            'Holds ServiceNow CSA, CAD & Microsoft Office Specialist among 6 certifications',
            'Skilled in Java, SQL, JavaScript, Power BI & Excel'
        ]
    }
];

export default teamData;
