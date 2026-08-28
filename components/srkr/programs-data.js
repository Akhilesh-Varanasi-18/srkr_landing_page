// =========================================================================
// ToriiMinds x SRKR — Programs & Course Syllabus Data
// Structured curriculum with concise, high-impact statements for optimal UI readability.
// =========================================================================

export const programsData = [
    {
        id: 'bamboo',
        icon: '🎋',
        name: 'Bamboo Coder',
        year: '1st Year',
        banner: '/assets/images/srkr/project-images/Torii_Program_banners/Bamboo_Coder.png',
        tagline: 'Coding Foundation from Scratch',
        description: 'Build your programming foundation with core computer science principles, problem-solving mindset, and hands-on coding in C.',
        badge: 'Foundation Track',
        themeColor: 'var(--srkr-primary)',
        accentBg: 'var(--srkr-bg-coral-tint)',
        courses: [
            {
                id: 'bamboo-c',
                title: 'C Programming & Logic Building',
                code: 'BMB-101',
                duration: '60 Hours',
                level: 'Beginner to Intermediate',
                prerequisites: 'None — Designed for B.Tech 1st Year Students',
                overview: 'Master foundational computer science concepts, memory layout, pointer arithmetic, structures, and file-driven modular C programs.',
                outcomes: [
                    'Write, debug, and compile clean, modular C programs independently',
                    'Apply control structures, loops, and functions to solve logical and aptitude problems',
                    'Work confidently with 1D/2D arrays, strings, pointer arithmetic, and dynamic memory',
                    'Use structures, unions, and file handling for structured persistent data storage',
                    'Build and present a complete real-world console-based C application from scratch'
                ],
                modules: [
                    {
                        moduleNumber: 'Module 1',
                        title: 'Fundamentals & Problem Solving',
                        duration: '10 Hours',
                        topics: [
                            'Introduction to Programming, Compilers & IDEs (Writing & Running C Programs)',
                            'Structure of a C Program, main() Function, Comments & Syntax',
                            'Data Types, Variables, Constants & Type Modifiers',
                            'Operators: Arithmetic, Relational, Logical, Bitwise, Assignment & Increment',
                            'Expressions, Operator Precedence & Input/Output (printf, scanf)',
                            'Basics of Algorithms & Flowcharts: Translating Logic into Code'
                        ]
                    },
                    {
                        moduleNumber: 'Module 2',
                        title: 'Control Structures & Looping',
                        duration: '12 Hours',
                        topics: [
                            'Decision-Making: if, if-else, nested if, else-if ladder & switch-case',
                            'Looping Constructs: for, while & do-while loops',
                            'Nested Loops & Loop Controls: break, continue & goto',
                            'Pattern Printing & Number-Based Problem Solving',
                            'Introduction to Time and Space Efficiency in Simple Programs'
                        ]
                    },
                    {
                        moduleNumber: 'Module 3',
                        title: 'Functions & Recursion',
                        duration: '12 Hours',
                        topics: [
                            'Function Declarations, Definitions, Function Calls & Return Types',
                            'Parameter Passing: Call by Value vs Call by Reference',
                            'Function Prototypes, Header Files & Modular Program Structure',
                            'Storage Classes: auto, static, extern & register',
                            'Scope & Lifetime of Variables',
                            'Recursion Principles, Base Cases & Classic Problems (Factorial, Fibonacci, GCD)',
                            'Recursion vs Iteration: Trade-offs & Call Stack Memory'
                        ]
                    },
                    {
                        moduleNumber: 'Module 4',
                        title: 'Arrays, Strings & Pointers',
                        duration: '14 Hours',
                        topics: [
                            '1D & 2D Arrays: Declaration, Initialization & Matrix Traversals',
                            'Passing Arrays to Functions & Array Algorithms',
                            'String Handling: Character Arrays & String Functions (strlen, strcpy, strcat, strcmp)',
                            'Pointers: Address Arithmetic, Pointers with Arrays & Strings',
                            'Pointers and Functions: Passing Pointers & Returning Pointers',
                            'Dynamic Memory Allocation: malloc, calloc, realloc & free'
                        ]
                    },
                    {
                        moduleNumber: 'Module 5',
                        title: 'Structures, File Handling & Mini Project',
                        duration: '12 Hours',
                        topics: [
                            'Structures: Declaration, Nested Structures & Arrays of Structures',
                            'Unions: Concept & Key Differences from Structures',
                            'File Handling: fopen, fclose, fread, fwrite, fprintf, fscanf',
                            'Sequential vs Random File Access, Preprocessor Directives & Macros',
                            'Pointers to Structures, Function Pointers & Command-Line Arguments',
                            'Debugging Techniques & Common Compile-Time/Run-Time Error Patterns',
                            'Mini-Project: Student Record System / Library Management System'
                        ]
                    }
                ]
            }
        ]
    },
    {
        id: 'skillup',
        icon: '📈',
        name: 'SkillUp Coder',
        year: '2nd Year',
        banner: '/assets/images/srkr/project-images/Torii_Program_banners/Skill_up_coder.png',
        tagline: 'Core Data Structures & Applied Algorithms',
        description: 'Level up with fundamental data structures, algorithm optimization, and interview-standard problem solving.',
        badge: 'Core Engineering Track',
        themeColor: 'var(--srkr-secondary)',
        accentBg: 'var(--srkr-bg-warm-tint)',
        courses: [
            {
                id: 'skillup-dsa',
                title: 'Data Structures & Algorithms (DSA)',
                code: 'SKL-201',
                duration: '80 Hours (11 Core Modules)',
                level: '',
                prerequisites: 'C / C++ or Java Fundamentals',
                overview: 'Comprehensive core DSA curriculum covering Big-O analysis, linear structures, trees, heaps, graphs, greedy methods, and foundational dynamic programming.',
                outcomes: [
                    'Analyze time and space complexity with Big-O notation',
                    'Implement Linked Lists, Stacks, Queues, Trees, and Graphs from scratch',
                    'Solve standard problems using Two Pointers, Sliding Window, and Hashing',
                    'Master Tree traversals, BST operations, BFS/DFS Graph traversals',
                    'Apply Greedy strategies, Recursion, and 1D Dynamic Programming',
                    'Crack product company technical online assessments (OA)'
                ],
                modules: [
                    {
                        moduleNumber: 'Module 1',
                        title: 'Complexity Analysis & Asymptotic Basics',
                        duration: '6 Hours',
                        topics: [
                            'Big-O, Big-Theta & Big-Omega Notations',
                            'Analyzing Linear & Nested Loop Complexities',
                            'Auxiliary Space vs Space Complexity Analysis'
                        ]
                    },
                    {
                        moduleNumber: 'Module 2',
                        title: 'Arrays & Matrix Foundations',
                        duration: '8 Hours',
                        topics: [
                            '1D Arrays & Memory Layout',
                            '2D Arrays & Matrix Traversals',
                            'Prefix Sum Arrays & Subarray Sum Problems'
                        ]
                    },
                    {
                        moduleNumber: 'Module 3',
                        title: 'Sorting & Searching Algorithms',
                        duration: '8 Hours',
                        topics: [
                            'Linear Search & Binary Search Fundamentals',
                            'Bubble Sort, Selection Sort & Insertion Sort',
                            'Merge Sort & Quick Sort Algorithmic Foundations'
                        ]
                    },
                    {
                        moduleNumber: 'Module 4',
                        title: 'Strings & Hashing Techniques',
                        duration: '8 Hours',
                        topics: [
                            'String Manipulation, Substrings & Palindrome Checking',
                            'HashMap & HashSet Architecture',
                            'Frequency Counting & Target Pair Lookup Problems'
                        ]
                    },
                    {
                        moduleNumber: 'Module 5',
                        title: 'Linked Lists (Singly, Doubly & Circular)',
                        duration: '8 Hours',
                        topics: [
                            'Singly Linked List: Insertion, Deletion & Traversal',
                            'Doubly & Circular Linked List Operations',
                            'Floyd\'s Cycle Detection & In-Place List Reversal'
                        ]
                    },
                    {
                        moduleNumber: 'Module 6',
                        title: 'Stacks & Queues',
                        duration: '6 Hours',
                        topics: [
                            'Stack Implementation & Balanced Parentheses Problem',
                            'Queue & Circular Queue Implementation',
                            'Deque & Introduction to Monotonic Stack Concepts'
                        ]
                    },
                    {
                        moduleNumber: 'Module 7',
                        title: 'Two Pointers & Sliding Window',
                        duration: '6 Hours',
                        topics: [
                            'Two Pointers Technique (Opposite Ends & Same Direction)',
                            'Fixed-Size vs Variable-Size Sliding Window',
                            'Maximum Subarray & Substring Problem Solving'
                        ]
                    },
                    {
                        moduleNumber: 'Module 8',
                        title: 'Recursion & Basic Backtracking',
                        duration: '8 Hours',
                        topics: [
                            'Recursion State Trees & Call Stack Principles',
                            'Subsets & Permutations Generation',
                            'Introduction to Grid & Board Backtracking'
                        ]
                    },
                    {
                        moduleNumber: 'Module 9',
                        title: 'Trees & Binary Search Trees (BST)',
                        duration: '8 Hours',
                        topics: [
                            'Binary Tree Traversals (In-order, Pre-order, Post-order, Level-order)',
                            'Binary Search Trees: Search, Insert & Delete Operations',
                            'Tree Height, Diameter & Lowest Common Ancestor (LCA)'
                        ]
                    },
                    {
                        moduleNumber: 'Module 10',
                        title: 'Heaps & Graphs Fundamentals',
                        duration: '8 Hours',
                        topics: [
                            'Min-Heap & Max-Heap Basics & Priority Queues',
                            'Graph Representations (Adjacency Matrix & List)',
                            'Breadth-First Search (BFS) & Depth-First Search (DFS)'
                        ]
                    },
                    {
                        moduleNumber: 'Module 11',
                        title: 'Greedy Strategy & DP (Intro)',
                        duration: '6 Hours',
                        topics: [
                            'Greedy Choice Property & Classic Activity Selection',
                            'Memoization (Top-Down) vs Tabulation (Bottom-Up)',
                            '1D Dynamic Programming: Climbing Stairs & 0/1 Knapsack Intro'
                        ]
                    }
                ]
            },
            {
                id: 'skillup-problem-solving',
                title: 'Applied Problem Solving & Contest Training',
                code: 'SKL-202',
                duration: '50 Hours (4 Modules)',
                level: '',
                prerequisites: 'Core DSA Knowledge',
                overview: 'Targeted problem-solving bootcamp focused on pattern recognition, edge-case analysis, and speed on online coding platforms.',
                outcomes: [
                    'Recognize algorithmic patterns within 2 minutes of reading problem statements',
                    'Avoid Time Limit Exceeded (TLE) & Memory Limit Exceeded (MLE) traps',
                    'Implement space-optimized solutions in competitive contests',
                    'Compete in weekly coding contests with top percentile rankings'
                ],
                modules: [
                    {
                        moduleNumber: 'Module 1',
                        title: 'Arrays, Strings, Math & Hashing Patterns',
                        duration: '15 Hours',
                        topics: [
                            'Array Math & Frequency Counting with HashMaps',
                            'String Manipulations & Anagram Checking',
                            'Number Theory: GCD, Prime Sieve & Divisibility',
                            'Prefix Sum & Difference Array Optimizations'
                        ]
                    },
                    {
                        moduleNumber: 'Module 2',
                        title: 'Two Pointers & Sliding Window Mastery',
                        duration: '12 Hours',
                        topics: [
                            'Two Pointers (Opposite Ends & Fast-Slow)',
                            'Fixed-Size vs Variable-Size Sliding Window',
                            'Subarray Sum Problems & Target Sum Optimization',
                            'Merge Intervals & Meeting Rooms Pattern'
                        ]
                    },
                    {
                        moduleNumber: 'Module 3',
                        title: 'Binary Search, Sorting & Bitwise Tricks',
                        duration: '10 Hours',
                        topics: [
                            'Binary Search on Rotated & Infinite Arrays',
                            'Binary Search on Answer Space (Predicate Functions)',
                            'Custom Sorting & Comparator Logic',
                            'Bitmasking & Bitwise Operations for Quick Subsets'
                        ]
                    },
                    {
                        moduleNumber: 'Module 4',
                        title: 'Recursion, Backtracking & Contest Mock OAs',
                        duration: '13 Hours',
                        topics: [
                            'Subset & Permutation Generation',
                            'Matrix Path Finding & Board Backtracking',
                            'Timed 90-Minute Mock Online Assessments',
                            'Editorial Walkthroughs & Benchmark Analysis'
                        ]
                    }
                ]
            }
        ]
    },
    {
        id: 'aiready',
        icon: '🤖',
        name: 'AI Ready Program',
        year: '3rd Year',
        banner: '/assets/images/srkr/project-images/Torii_Program_banners/AI_ready_eng.png',
        tagline: '',
        description: 'Comprehensive industry preparation featuring Full Stack Development, Flutter, Cloud, ServiceNow, and modern AI skills.',
        badge: 'Career & Industry Track',
        themeColor: 'var(--srkr-tertiary)',
        accentBg: 'var(--srkr-bg-warm-offwhite)',
        courses: [
            {
                id: 'aiready-fullstack',
                title: 'Full Stack Development + AI Integration',
                code: 'AIR-301',
                duration: '70 Hours',
                level: 'Beginner to Advanced',
                prerequisites: 'Basic Programming Fundamentals',
                overview: 'Master HTML5, CSS3, JavaScript, React.js, Node.js, Express, MongoDB, Generative AI API integrations, and cloud deployment.',
                outcomes: [
                    'Build responsive, accessible frontend user interfaces with HTML5, CSS3, and React.js',
                    'Develop secure RESTful backend APIs with Node.js, Express.js, and JWT authentication',
                    'Model and query scalable NoSQL databases with MongoDB Atlas and Mongoose',
                    'Integrate Generative AI APIs (Gemini, OpenAI, Claude) with streaming chat capabilities',
                    'Containerize applications with Docker and deploy to Vercel and AWS cloud infrastructure',
                    'Deliver an end-to-end production-ready AI-powered SaaS full-stack capstone project'
                ],
                modules: [
                    {
                        moduleNumber: 'Module 1',
                        title: 'Web Fundamentals: HTML5 & Modern CSS',
                        duration: '8 Hours',
                        topics: [
                            'HTML5 Semantic Elements, Forms & Input Validations',
                            'CSS3 Box Model, Flexbox & CSS Grid Layouts',
                            'Responsive Web Design: Media Queries & Mobile-First Design',
                            'Tailwind CSS Fundamentals & Utility-First Styling',
                            'Mini-Project: Responsive Developer Portfolio Landing Page'
                        ]
                    },
                    {
                        moduleNumber: 'Module 2',
                        title: 'JavaScript Mastery & Async Programming',
                        duration: '10 Hours',
                        topics: [
                            'JavaScript Core: Data Types, Scope, Closures & Hoisting',
                            'Modern ES6+ Features: Arrow Functions, Destructuring & Modules',
                            'DOM Manipulation, Event Handling & Local Storage',
                            'Asynchronous JavaScript: Promises, Async/Await & Fetch API',
                            'Consuming Third-Party REST APIs & JSON Parsing'
                        ]
                    },
                    {
                        moduleNumber: 'Module 3',
                        title: 'Frontend Engineering with React.js',
                        duration: '12 Hours',
                        topics: [
                            'React Architecture: JSX, Virtual DOM & Component Lifecycle',
                            'React Hooks: useState, useEffect, useRef & Custom Hooks',
                            'Client-Side Routing with React Router (Dynamic & Protected Routes)',
                            'State Management: Context API & Zustand Fundamentals',
                            'Mini-Project: E-Commerce Catalog UI with Cart State'
                        ]
                    },
                    {
                        moduleNumber: 'Module 4',
                        title: 'Backend Engineering with Node.js & Express',
                        duration: '10 Hours',
                        topics: [
                            'Node.js Architecture, Event Loop & Core Modules (fs, http, path)',
                            'Express.js Server Architecture, Routing & Controllers',
                            'Custom Middleware: Logging, CORS & Error Handling',
                            'RESTful API Design Best Practices & HTTP Status Codes',
                            'API Testing & Documentation with Postman'
                        ]
                    },
                    {
                        moduleNumber: 'Module 5',
                        title: 'Database Engineering with MongoDB & Mongoose',
                        duration: '10 Hours',
                        topics: [
                            'MongoDB Architecture, Documents & Atlas Cloud Cluster Setup',
                            'Mongoose ODM: Schemas, Models, Validations & Virtuals',
                            'CRUD Operations & Complex Query Filters',
                            'Data Relationships (Embedding vs Referencing) & Population',
                            'MongoDB Aggregation Pipelines & Database Indexing'
                        ]
                    },
                    {
                        moduleNumber: 'Module 6',
                        title: 'Authentication, Authorization & Security',
                        duration: '6 Hours',
                        topics: [
                            'Password Hashing & Salt Generation with bcrypt',
                            'JSON Web Tokens (JWT): Authentication & Token Verification',
                            'Role-Based Access Control (RBAC): Admin vs User Routes',
                            'Web Security: Helmet, Rate Limiting, Input Sanitization & CORS'
                        ]
                    },
                    {
                        moduleNumber: 'Module 7',
                        title: 'AI API Integration & Generative AI Features',
                        duration: '8 Hours',
                        topics: [
                            'Generative AI APIs: Google Gemini, OpenAI & Anthropic Claude',
                            'Connecting Backend APIs to LLMs using SDKs & Axios',
                            'Streaming Real-Time AI Responses with Server-Sent Events',
                            'Building an AI Chatbot UI with Message History',
                            'API Key Security, Rate Limiting & Prompt Engineering'
                        ]
                    },
                    {
                        moduleNumber: 'Module 8',
                        title: 'Cloud Deployment, DevOps & Production Capstone',
                        duration: '6 Hours',
                        topics: [
                            'Environment Configurations & Production Secrets (.env)',
                            'Docker Containerization: Frontend & Backend Dockerfiles',
                            'Cloud Deployment: Frontend on Vercel & Backend on AWS / Render',
                            'Automated CI/CD Workflows with GitHub Actions',
                            'Full-Stack Capstone Project: AI-Powered SaaS Web Application'
                        ]
                    }
                ]
            },
            {
                id: 'aiready-flutter',
                title: 'Google Flutter + AI Integration',
                code: 'AIR-302',
                duration: '60 Hours',
                level: 'Beginner to Advanced',
                prerequisites: 'Basic Programming Fundamentals',
                overview: 'Build cross-platform mobile apps from Dart basics to Firebase backends, AI Chatbots, and Play Store / App Store publishing.',
                outcomes: [
                    'Build complete Android & iOS apps from a single codebase with Flutter',
                    'Master Material Design UI, theming, and state management with Provider',
                    'Integrate live REST APIs, Firebase Auth & Cloud Storage',
                    'Integrate Generative AI APIs (Gemini, Claude) and build AI Chatbots',
                    'Generate signed builds and publish to Google Play Store & Apple App Store',
                    'Master prompt engineering and structured AI outputs with Claude AI'
                ],
                modules: [
                    {
                        moduleNumber: 'Module 1',
                        title: 'Introduction to Dart Programming',
                        duration: '6 Hours',
                        topics: [
                            'Basics of Dart: Variables, Data Types, Operators & Keywords',
                            'Control Flow: if / else if / else, switch-case statements',
                            'Loops & Control Statements: for, while, do-while, break, continue',
                            'Functions, Methods, Optional Parameters & Lambda Expressions',
                            'Collections Framework: List, Set, Map & Collection Methods'
                        ]
                    },
                    {
                        moduleNumber: 'Module 2',
                        title: 'Object-Oriented Programming in Dart',
                        duration: '6 Hours',
                        topics: [
                            'Classes, objects, constructors & named parameters',
                            'Inheritance, encapsulation, polymorphism & abstract classes',
                            'Static variables, methods & factory constructors',
                            'Enums, mixins & generic types'
                        ]
                    },
                    {
                        moduleNumber: 'Module 3',
                        title: 'Introduction to the Flutter Framework',
                        duration: '6 Hours',
                        topics: [
                            'Flutter SDK installation, CLI setup & emulator config',
                            'Flutter project creation & folder structure walkthrough',
                            'Widget Tree concepts: Stateless vs Stateful Widgets',
                            'Core Layout Widgets: Container, Row, Column, Stack, ListView'
                        ]
                    },
                    {
                        moduleNumber: 'Module 4',
                        title: 'Material Design, Navigation & State Management',
                        duration: '8 Hours',
                        topics: [
                            'Material Design: Scaffold, AppBar, Bottom Navigation Bar',
                            'UI Components: Buttons, Forms, Input Fields, Dialogs, Bottom Sheets',
                            'Theming & Styling: Colors, typography, dark/light mode',
                            'State Management: setState fundamentals & Provider architecture'
                        ]
                    },
                    {
                        moduleNumber: 'Module 5',
                        title: 'REST API Integration & Firebase Services',
                        duration: '8 Hours',
                        topics: [
                            'HTTP package, REST API calls & JSON model serialization',
                            'Error handling, network timeouts & async loading states',
                            'Firebase Setup: Authentication (Email/Password & Google Sign-In)',
                            'Firebase Cloud Storage: File uploads & cloud image rendering'
                        ]
                    },
                    {
                        moduleNumber: 'Module 6',
                        title: 'AI API Integration & AI Chatbot',
                        duration: '10 Hours',
                        topics: [
                            'Generative AI & LLM integration for mobile apps',
                            'Connecting OpenAI & Google Gemini APIs using http/dio',
                            'Streaming AI responses for real-time token output',
                            'AI Chatbot UI: Message bubbles, typing indicators, chat history',
                            'State management for chat sessions with Provider',
                            'Voice AI: Speech-to-Text & Text-to-Speech integration',
                            'Securing API keys & managing rate limits in production'
                        ]
                    },
                    {
                        moduleNumber: 'Module 7',
                        title: 'App Deployment & Publishing',
                        duration: '8 Hours',
                        topics: [
                            'Generating signed Android APK & Android App Bundle (AAB)',
                            'Keystore generation & release build configuration',
                            'Publishing to Google Play Store: Store listing & release tracks',
                            'Apple App Store preparation: Provisioning profiles & TestFlight',
                            'App versioning, OTA updates & staged rollouts'
                        ]
                    },
                    {
                        moduleNumber: 'Module 8',
                        title: 'Claude AI Training & Prompt Mastery',
                        duration: '8 Hours',
                        topics: [
                            'Introduction to Claude & Anthropic API models',
                            'Setting up API keys, authentication & claude.ai interface',
                            'Claude API request/response architecture',
                            'Prompt Engineering: System prompts, role prompting, few-shot examples',
                            'Requesting structured JSON outputs & streamed responses',
                            'Practical use cases: Summarization, data extraction, coding help',
                            'Responsible AI: Safety guidelines, content moderation & cost control'
                        ]
                    }
                ]
            },
            {
                id: 'aiready-cloud-devops',
                title: 'AWS Cloud and Devops + AI Integration',
                code: 'AIR-303',
                duration: '134 Hours',
                level: 'Intermediate to Advanced',
                prerequisites: 'Basic Computer Networking & Operating System Fundamentals',
                overview: 'Master AWS cloud architecture, Linux, Docker, Kubernetes, Terraform CI/CD, and Amazon Bedrock GenAI with capstone project.',
                outcomes: [
                    'Master computer networking fundamentals, TCP/IP, VPC subnetting, and Linux Bash automation',
                    'Architect scalable AWS cloud infrastructure (EC2, S3, RDS, VPC, IAM, Serverless Lambda)',
                    'Containerize applications with Docker and orchestrate microservices using Kubernetes & Amazon EKS',
                    'Automate infrastructure as code with Terraform and build CI/CD pipelines with GitHub Actions / Jenkins',
                    'Integrate GenAI on AWS using Amazon Bedrock, Knowledge Bases for RAG, AgentCore, and Amazon Q Developer',
                    'Build a production 3-tier capstone application with CI/CD and prepare for AWS Certifications (CLF-C02, AIF-C01)'
                ],
                modules: [
                    {
                        moduleNumber: 'Module 1',
                        title: 'Networking Essentials',
                        duration: '10 Hours',
                        topics: [
                            'OSI 7-Layer & TCP/IP Network Models, Ports & Protocols',
                            'IPv4 / IPv6 Addressing, Subnetting & CIDR Notation',
                            'Routing, Switching, DNS & DHCP Name Resolution',
                            'Network Security: Firewalls, VPNs, NAT Gateways & Proxies',
                            'Hands-on Lab: Subnet Design Exercise & Wireshark Packet Capture'
                        ]
                    },
                    {
                        moduleNumber: 'Module 2',
                        title: 'Linux Fundamentals & Shell Scripting',
                        duration: '16 Hours',
                        topics: [
                            'Linux Architecture & Major Distributions (Amazon Linux, Ubuntu)',
                            'Filesystem Hierarchy, Users, Groups & Sudo Permissions',
                            'Package Management (yum/dnf, apt) & Systemd Service Controls',
                            'Bash Scripting: Variables, Loops, Conditionals & Functions',
                            'Remote Access (SSH Key-Auth), Cron Jobs & Journald System Logs',
                            'Hands-on Lab: Provision, Harden & Automate an EC2 Linux Server'
                        ]
                    },
                    {
                        moduleNumber: 'Module 3',
                        title: 'AWS Cloud Core Services',
                        duration: '36 Hours',
                        topics: [
                            'AWS Global Infrastructure: Regions, Availability Zones & Edge Locations',
                            'Identity & Access Management (IAM): Users, Roles, Policies & MFA',
                            'Virtual Private Cloud (VPC): Subnets, Route Tables, NAT & Security Groups',
                            'Compute: Amazon EC2 Instances, AMIs, Auto Scaling & Elastic Load Balancing',
                            'Storage & Databases: S3 Lifecycle Policies, EFS, RDS & DynamoDB',
                            'Observability & Serverless: CloudWatch, CloudTrail, AWS Lambda & API Gateway',
                            'Cloud Security: Security Hub, GuardDuty, WAF & Well-Architected Framework',
                            'Mini-Project: Deploy a Highly Available 3-Tier Web App on AWS'
                        ]
                    },
                    {
                        moduleNumber: 'Module 4',
                        title: 'DevOps',
                        duration: '40 Hours',
                        topics: [
                            'DevOps Culture, Branching Strategies & Git / GitHub Workflows',
                            'Automated CI/CD Pipelines with Jenkins, AWS CodePipeline & CodeBuild',
                            'Docker: Containerization, Multi-Stage Dockerfiles & Docker Compose',
                            'Kubernetes & Amazon EKS: Pods, Deployments, Services & Helm Charts',
                            'Infrastructure as Code (IaC) with Terraform & CloudFormation',
                            'Configuration Management with Ansible & DevSecOps Security Scanning',
                            'Hands-on Project: End-to-End CI/CD Pipeline Deploying App to EKS'
                        ]
                    },
                    // {
                    //     moduleNumber: 'Module 5',
                    //     title: 'AI on AWS (GenAI & MLOps)',
                    //     duration: '18 Hours',
                    //     topics: [
                    //         'AWS AI/ML Ecosystem & Foundation Models Overview',
                    //         'Amazon Bedrock: Unified Claude, Llama & Nova Model Access',
                    //         'Knowledge Bases for Retrieval-Augmented Generation (RAG)',
                    //         'Bedrock AgentCore: Autonomous Multi-Tool AI Agents',
                    //         'Amazon Q Developer: AI Pair-Programming (/dev, /transform, /test)',
                    //         'Amazon SageMaker Fundamentals & Responsible AI Guardrails',
                    //         'Hands-on Lab: Build a RAG Chatbot with Bedrock Knowledge Bases'
                    //     ]
                    // },
                    {
                        moduleNumber: 'Module 5',
                        title: 'Capstone Project & AWS Certification Prep',
                        duration: '14 Hours',
                        topics: [
                            'Capstone Project: 3-Tier App with Full CI/CD, EKS & Bedrock AI Integration',
                            'Live Project Demonstration, Architecture Review & Defense',
                            'AWS Certified Cloud Practitioner (CLF-C02) Prep & Mock Questions',
                            'AWS Certified AI Practitioner (AIF-C01) & Solutions Architect Roadmap',
                            'Final Practical Assessment & Technical Interview Prep'
                        ]
                    }
                ]
            },
            {
                id: 'aiready-servicenow',
                title: 'ServiceNow Platform Engineering',
                code: 'AIR-304',
                duration: '80 Hours',
                level: 'Intermediate to Advanced',
                prerequisites: 'JavaScript Fundamentals & Relational Data Basics',
                overview: 'Master ServiceNow administration, GlideRecord scripting, Flow Designer, IntegrationHub, Now Assist AI, and CSA / CAD certification prep.',
                outcomes: [
                    'Configure ServiceNow tables, forms, lists, UI policies, and business rules',
                    'Implement Access Control Lists (ACLs), Security Rules, and delegated administration',
                    'Develop server-side & client-side scripts using GlideRecord, GlideAjax, and Script Includes',
                    'Automate enterprise workflows with Flow Designer and build integrations via IntegrationHub',
                    'Integrate Now Assist generative AI skills, predictive intelligence, and AI Agents',
                    'Prepare for Certified System Administrator (CSA) & Certified Application Developer (CAD) exams'
                ],
                modules: [
                    {
                        moduleNumber: 'Module 1',
                        title: 'Platform Orientation & Core Concepts',
                        duration: 'CSA Track',
                        topics: [
                            'Now Platform Architecture, Instance Model & PDI Setup',
                            'Platform Navigation: UI16, Lists, Filters, Forms & Related Lists',
                            'Tables & Data Model: Fields, Field Types, Dictionary & References'
                        ]
                    },
                    {
                        moduleNumber: 'Module 2',
                        title: 'Users, Groups, Roles & Security Basics',
                        duration: 'CSA Track',
                        topics: [
                            'Users, Groups, Roles & Company/Department Records',
                            'Introduction to Access Control Lists (ACLs)',
                            'Delegated Administration & Role Hierarchy'
                        ]
                    },
                    {
                        moduleNumber: 'Module 3',
                        title: 'Forms, Lists & Client-Side Configuration',
                        duration: 'CSA Track',
                        topics: [
                            'Form & List Layout Customization & List Control',
                            'UI Policies vs Client Scripts Best Practices',
                            'Business Rules (Before, After, Async, Display)'
                        ]
                    },
                    {
                        moduleNumber: 'Module 4',
                        title: 'Notifications, SLAs & Data Management',
                        duration: 'CSA Track',
                        topics: [
                            'Email Notifications, Templates & SLA / OLA Configuration',
                            'Update Sets: Creation, Capturing & Instance Migration',
                            'Import Sets & Transform Maps: Coalescing & Field Mapping'
                        ]
                    },
                    {
                        moduleNumber: 'Module 5',
                        title: 'ITSM Core Applications & CMDB',
                        duration: 'CSA Track',
                        topics: [
                            'Incident Management Lifecycle, States & Assignment',
                            'Problem & Change Management (CAB & Risk Assessment)',
                            'Service Catalog, Catalog Items, Variables & Record Producers',
                            'Configuration Management Database (CMDB) & Discovery Overview'
                        ]
                    },
                    {
                        moduleNumber: 'Module 6',
                        title: 'Advanced Administration & Security',
                        duration: 'CSA Track',
                        topics: [
                            'Access Control Lists (ACL) Deep-Dive: Roles, Conditions & Scripting',
                            'Data Policies, System Properties & Scheduled Jobs',
                            'System Logs, Troubleshooting & Script Debugger Basics'
                        ]
                    },
                    {
                        moduleNumber: 'Module 7',
                        title: 'Reporting, Dashboards & AI Administration',
                        duration: 'CSA Track',
                        topics: [
                            'Reports, Dashboards, Gauges & Performance Analytics',
                            'Predictive Intelligence: ML-Based Auto-Categorization & Assignment',
                            'Now Assist AI Architecture & GenAI Platform Overview'
                        ]
                    },
                    {
                        moduleNumber: 'Module 8',
                        title: 'CSA Exam Prep & Certification Checkpoint',
                        duration: 'CSA Track',
                        topics: [
                            'Full CSA Domain Review: Interface, UI, Users & Security',
                            'Automated Test Framework (ATF) Introduction',
                            'Timed Full-Length Mock Exams & Gap Analysis',
                            'Checkpoint: Certified System Administrator (CSA) Prep'
                        ]
                    },
                    {
                        moduleNumber: 'Module 9',
                        title: 'Scripting Foundations (Server & Client)',
                        duration: 'CAD Track',
                        topics: [
                            'JavaScript Refresher for ServiceNow (ES5 / ES6 Focus)',
                            'Server-Side: GlideRecord, GlideAggregate & Script Includes',
                            'Client-Side: GlideForm (g_form), GlideUser (g_user) & GlideAjax',
                            'Debugging: Background Scripts & gs.info Best Practices'
                        ]
                    },
                    {
                        moduleNumber: 'Module 10',
                        title: 'Scoped Application Development',
                        duration: 'CAD Track',
                        topics: [
                            'ServiceNow Studio IDE & Scoped Application Architecture',
                            'Custom Tables, Application Menus & Cross-Scope Access',
                            'Scoped Business Rules, Script Includes & Client Scripts'
                        ]
                    },
                    {
                        moduleNumber: 'Module 11',
                        title: 'Custom UI & Access Control',
                        duration: 'CAD Track',
                        topics: [
                            'UI Actions, UI Pages & UI Macros Customization',
                            'Scoped Access Control Lists (ACLs) & Custom Role Design'
                        ]
                    },
                    {
                        moduleNumber: 'Module 12',
                        title: 'Flow Designer & Process Automation',
                        duration: 'CAD Track',
                        topics: [
                            'Flow Designer: Triggers, Actions, Flows vs Subflows',
                            'Advanced Flow Automation: Approvals, Error Handling & Custom Actions'
                        ]
                    },
                    {
                        moduleNumber: 'Module 13',
                        title: 'IntegrationHub & Web Services',
                        duration: 'CAD Track',
                        topics: [
                            'Scripted REST APIs, Inbound REST Messages & SOAP Basics',
                            'IntegrationHub Spokes, Connections & Credential Aliases',
                            'Building Custom IntegrationHub Actions & Data Pipelines'
                        ]
                    },
                    {
                        moduleNumber: 'Module 14',
                        title: 'AI Agents & Generative AI Development',
                        duration: 'CAD Track',
                        topics: [
                            'Now Assist: GenAI Controller, LLM Connections & Now Assist Skills',
                            'Embedding Generative AI Summarization into Custom Scoped Apps',
                            'AI Agents on Now Platform: AI Agent Studio & Multi-Agent Orchestration',
                            'Responsible AI: Data Governance, PII Guardrails & Security Policies'
                        ]
                    },
                    {
                        moduleNumber: 'Module 15',
                        title: 'Testing, Capstone & CAD Exam Prep',
                        duration: 'CAD Track',
                        topics: [
                            'Automated Test Framework (ATF) Test Suites for Scoped Apps',
                            'Performance Optimization & GlideRecord Anti-Patterns Review',
                            'Capstone Project: Custom Scoped App with Flow Automation & Now Assist AI',
                            'Full CAD Domain Review, Mock Exams & Exam Checkpoint'
                        ]
                    }
                ]
            }
        ]
    },
    {
        id: 'owlcoder',
        icon: '🦉',
        name: 'Owl Coder',
        year: 'Exclusive For 2028 Batch',
        banner: '/assets/images/srkr/project-images/Torii_Program_banners/Owlcoder.png',
        tagline: 'Elite Competitive Programming & Advanced DSA',
        description: 'An exclusive program for coding champions focusing on advanced algorithms, competitive programming, and high-package placement preparation.',
        badge: 'Elite Competitive Track',
        themeColor: 'var(--srkr-primary)',
        accentBg: 'var(--srkr-bg-coral-tint)',
        courses: [
            {
                id: 'owl-adv-dsa',
                title: 'Advanced Competitive Programming & DSA Mastery',
                code: 'OWL-401',
                duration: '8 Weeks',
                level: '',
                prerequisites: 'Strong DSA & Coding Foundations',
                overview: 'Intensive 21-module advanced roadmap covering complexity analysis, advanced data structures, Graph algorithms, DP patterns, Segment Trees, and competitive number theory.',
                outcomes: [
                    'Master Big-O, Big-Theta, and Big-Omega asymptotic complexity analysis',
                    'Implement advanced Sorting, Searching on Answer, and Kadane / Prefix Sum patterns',
                    'Solve Hard-tier Recursion, Backtracking (N-Queens, Sudoku), and Monotonic Stacks',
                    'Master complete Tree and Graph algorithms (Shortest Paths, MST, DSU, Bridges)',
                    'Master Dynamic Programming patterns (1D, 2D Grid, Knapsack, Bitmask, Digit DP)',
                    'Implement Segment Trees, Fenwick Trees, String Algorithms (KMP, Z-Algorithm), and Number Theory'
                ],
                modules: [
                    {
                        moduleNumber: 'Module 1',
                        title: 'Complexity Analysis',
                        duration: 'Core',
                        topics: [
                            'Big-O, Big-Theta & Big-Omega Asymptotic Analysis (Detailed)',
                            'Recurrence Relations & Master Theorem'
                        ]
                    },
                    {
                        moduleNumber: 'Module 2',
                        title: 'Sorting (Advanced)',
                        duration: 'Core',
                        topics: [
                            'Merge Sort Implementation & Inversion Count',
                            'Quick Sort (Lomuto & Hoare Partitioning)',
                            'Heap Sort & Priority Queue Sorting'
                        ]
                    },
                    {
                        moduleNumber: 'Module 3',
                        title: 'Arrays (Advanced)',
                        duration: 'Core',
                        topics: [
                            'Array Rearrangement & Rotation Techniques',
                            'Kadane\'s Algorithm for Maximum Subarray Sum',
                            'Prefix Sum & 2D Difference Array Optimization'
                        ]
                    },
                    {
                        moduleNumber: 'Module 4',
                        title: 'Searching (Advanced)',
                        duration: 'Core',
                        topics: [
                            'Binary Search on Answer Space (Predicate Functions)',
                            'Binary Search on Rotated & Modified Arrays'
                        ]
                    },
                    {
                        moduleNumber: 'Module 5',
                        title: 'Strings (Advanced)',
                        duration: 'Core',
                        topics: [
                            'Advanced String Manipulation & Substring Problems',
                            'String Polynomial Rolling Hashing Basics'
                        ]
                    },
                    {
                        moduleNumber: 'Module 6',
                        title: 'Linked List (Advanced)',
                        duration: 'Core',
                        topics: [
                            'Singly, Doubly & Circular Linked List Operations',
                            'Floyd\'s Cycle Detection, K-Group Reversal & Multi-Way Merge'
                        ]
                    },
                    {
                        moduleNumber: 'Module 7',
                        title: 'Recursion & Backtracking (Advanced)',
                        duration: 'Core',
                        topics: [
                            'Advanced Recursion State Trees & Call Stack Memory',
                            'N-Queens, Sudoku Solver & Complex Matrix Backtracking',
                            'Full Permutations, Combinations & Subsets Generation'
                        ]
                    },
                    {
                        moduleNumber: 'Module 8',
                        title: 'Bit Manipulation',
                        duration: 'Core',
                        topics: [
                            'Bit Manipulation Full Pattern Set & Bitmasks',
                            'Fast Exponentiation & Bitwise Subsets Generation'
                        ]
                    },
                    {
                        moduleNumber: 'Module 9',
                        title: 'Stack & Queue',
                        duration: 'Core',
                        topics: [
                            'Stack Advanced Applications & Expression Evaluation',
                            'Queue, Deque & Circular Queue Architecture',
                            'Monotonic Stack & Monotonic Queue Patterns'
                        ]
                    },
                    {
                        moduleNumber: 'Module 10',
                        title: 'Two Pointer & Sliding Window',
                        duration: 'Core',
                        topics: [
                            'Two Pointer Advanced Problems (Opposite Ends & Meet in Middle)',
                            'Sliding Window Dynamic Subarray & Substring Patterns'
                        ]
                    },
                    {
                        moduleNumber: 'Module 11',
                        title: 'Hashing',
                        duration: 'Core',
                        topics: [
                            'Advanced Frequency Counting & Custom Hash Functions',
                            'Target Pair & Subarray Sum Hashing Optimization'
                        ]
                    },
                    {
                        moduleNumber: 'Module 12',
                        title: 'Heaps (Advanced)',
                        duration: 'Core',
                        topics: [
                            'Min-Heap & Max-Heap Custom Comparators',
                            'Priority Queue Advanced K-Way Merge & Median Maintenance'
                        ]
                    },
                    {
                        moduleNumber: 'Module 13',
                        title: 'Greedy Algorithms',
                        duration: 'Core',
                        topics: [
                            'Greedy Choice Property Proofs & Full Pattern Set',
                            'Interval Scheduling, Huffman Coding & Gas Station Problems'
                        ]
                    },
                    {
                        moduleNumber: 'Module 14',
                        title: 'Divide & Conquer',
                        duration: 'Core',
                        topics: [
                            'Divide and Conquer Algorithmic Paradigm',
                            'Closest Pair of Points & Matrix Multiplication'
                        ]
                    },
                    {
                        moduleNumber: 'Module 15',
                        title: 'Trees (Complete)',
                        duration: 'Core',
                        topics: [
                            'Binary Trees & Binary Search Trees (BST) Full Concepts',
                            'Recursive & Iterative Tree Traversals',
                            'Diameter, Lowest Common Ancestor (LCA) & Tree Views',
                            'Tree Serialization, Deserialization & Construction'
                        ]
                    },
                    {
                        moduleNumber: 'Module 16',
                        title: 'Tries',
                        duration: 'Core',
                        topics: [
                            'Trie Construction, Insertion & Prefix Search',
                            'Trie Advanced Applications (Auto-complete & Maximum XOR Pair)'
                        ]
                    },
                    {
                        moduleNumber: 'Module 17',
                        title: 'Graphs (Complete)',
                        duration: 'Core',
                        topics: [
                            'Graph Representations (Adjacency Matrix & List)',
                            'Advanced BFS & DFS Traversals & Cycle Detection',
                            'Shortest Path: Dijkstra, Bellman-Ford & Floyd-Warshall',
                            'Minimum Spanning Trees: Prim\'s & Kruskal\'s Algorithms',
                            'Topological Sorting & Disjoint Set Union (DSU / Union-Find)',
                            'Strongly Connected Components (SCC), Bridges & Articulation Points'
                        ]
                    },
                    {
                        moduleNumber: 'Module 18',
                        title: 'Dynamic Programming (Complete)',
                        duration: 'Core',
                        topics: [
                            'DP 1D Patterns & Transition States',
                            'DP 2D & Matrix Grid Patterns',
                            'Knapsack Patterns (0/1, Unbounded, Fractional)',
                            'String DP: Longest Common Subsequence (LCS), Edit Distance, Palindromes',
                            'Advanced DP: Bitmask DP, Digit DP & Tree DP'
                        ]
                    },
                    {
                        moduleNumber: 'Module 19',
                        title: 'Segment Tree & Fenwick Tree',
                        duration: 'CP Track',
                        topics: [
                            'Segment Tree Construction, Point Updates & Range Queries',
                            'Fenwick Tree (Binary Indexed Tree / BIT) Operations'
                        ]
                    },
                    {
                        moduleNumber: 'Module 20',
                        title: 'String Algorithms',
                        duration: 'CP Track',
                        topics: [
                            'Knuth-Morris-Pratt (KMP) Pattern Matching',
                            'Z-Algorithm for Pattern Searching',
                            'Rabin-Karp Rolling Hash Algorithm',
                            'Manacher\'s Algorithm for Longest Palindromic Substring'
                        ]
                    },
                    {
                        moduleNumber: 'Module 21',
                        title: 'Number Theory',
                        duration: 'CP Track',
                        topics: [
                            'Greatest Common Divisor (GCD) & Extended Euclidean Algorithm',
                            'Sieve of Eratosthenes & Prime Factorization',
                            'Modular Arithmetic, Modular Inverse & Fermat\'s Little Theorem'
                        ]
                    }
                ]
            }
        ]
    },
    {
        id: 'mooncoder',
        icon: '🌙',
        name: 'Moon Coder',
        year: 'Exclusive For 2029 Batch',
        banner: '/assets/images/srkr/project-images/Torii_Program_banners/Moon_coder.png',
        tagline: 'Core Problem Solving & DSA Readiness',
        description: 'Comprehensive 15-module core problem-solving curriculum taking learners from programming fundamentals through Linear Data Structures, Two Pointers, and Backtracking.',
        badge: 'Master Problem Solving Track',
        themeColor: 'var(--srkr-secondary)',
        accentBg: 'var(--srkr-bg-warm-tint)',
        courses: [
            {
                id: 'moon-dsa-mastery',
                title: 'Core Problem Solving & DSA Readiness',
                code: 'MOON-501',
                duration: '8 Weeks',
                level: '',
                prerequisites: 'Beginner Friendly — Designed for BTech Coursework Pace',
                overview: 'Sequential 15-module coverage from programming fundamentals through Arrays, Strings, Hashing, Linked Lists, Stacks, Queues, Two Pointers, and Backtracking.',
                outcomes: [
                    'Master programming fundamentals, syntax, control flow, loops, and functions',
                    'Solve standard problems in Arrays, Strings, Math, Sorting, and Searching',
                    'Implement core data structures: HashMaps, Linked Lists, Stacks, and Queues',
                    'Apply algorithmic patterns: Two Pointers, Sliding Window, Prefix Sum, and Backtracking',
                    'Build strong problem-solving foundations ready for competitive coding'
                ],
                modules: [
                    {
                        moduleNumber: 'Module 1',
                        title: 'Programming Fundamentals',
                        duration: 'Core',
                        topics: [
                            'IDE & Compiler Setup',
                            'Variables & Data Types',
                            'Input / Output Operations',
                            'Operators & Expressions',
                            'Conditional Statements (if-else, switch)',
                            'Loops & Iteration (for, while, do-while)',
                            'Pattern Printing (Star & Number Patterns)',
                            'Functions & Methods'
                        ]
                    },
                    {
                        moduleNumber: 'Module 2',
                        title: 'Arrays',
                        duration: 'Core',
                        topics: [
                            '1D Arrays & Memory Layout',
                            '2D Arrays & Matrix Traversals',
                            'Basic Array Manipulations & Problem Solving'
                        ]
                    },
                    {
                        moduleNumber: 'Module 3',
                        title: 'Strings',
                        duration: 'Core',
                        topics: [
                            'String Basics & Memory Representation',
                            'String Manipulation Problems',
                            'Palindrome Checking & Pattern Matching'
                        ]
                    },
                    {
                        moduleNumber: 'Module 4',
                        title: 'Math & Number Problems',
                        duration: 'Core',
                        topics: [
                            'Number Theory & Digit Extraction Problems',
                            'Basic Math: GCD, LCM, Series & Prime Numbers'
                        ]
                    },
                    {
                        moduleNumber: 'Module 5',
                        title: 'Time & Space Complexity',
                        duration: 'Core',
                        topics: [
                            'Big-O Notation Fundamentals',
                            'Analyzing Loops, Nested Loops & Space Constraints'
                        ]
                    },
                    {
                        moduleNumber: 'Module 6',
                        title: 'Recursion',
                        duration: 'Core',
                        topics: [
                            'Recursion Fundamentals & Call Stack Memory',
                            'Array & String Recursion Problems',
                            'Introduction to Basic Backtracking'
                        ]
                    },
                    {
                        moduleNumber: 'Module 7',
                        title: 'Bit Manipulation (Basic)',
                        duration: 'Core',
                        topics: [
                            'Bitwise Operators (&, |, ^, ~, <<, >>)',
                            'Bitwise Masking & Problem Solving Basics'
                        ]
                    },
                    {
                        moduleNumber: 'Module 8',
                        title: 'Sorting',
                        duration: 'Core',
                        topics: [
                            'Bubble Sort Algorithm',
                            'Selection Sort Algorithm',
                            'Insertion Sort Algorithm'
                        ]
                    },
                    {
                        moduleNumber: 'Module 9',
                        title: 'Searching',
                        duration: 'Core',
                        topics: [
                            'Linear Search Implementation',
                            'Binary Search Fundamentals & Iterative / Recursive Logic'
                        ]
                    },
                    {
                        moduleNumber: 'Module 10',
                        title: 'Hashing',
                        duration: 'Core',
                        topics: [
                            'HashMap & HashSet Architecture',
                            'Frequency Counting & Fast Lookup Problems'
                        ]
                    },
                    {
                        moduleNumber: 'Module 11',
                        title: 'Linked List',
                        duration: 'Core',
                        topics: [
                            'Singly Linked List (Creation, Insertion, Deletion)',
                            'Doubly Linked List Implementation',
                            'Core Problems: Traversal, Reversal & Cycle Detection'
                        ]
                    },
                    {
                        moduleNumber: 'Module 12',
                        title: 'Stack',
                        duration: 'Core',
                        topics: [
                            'Stack Concepts & Array/Linked List Implementation',
                            'Basic Applications (Balanced Parentheses & Evaluation)'
                        ]
                    },
                    {
                        moduleNumber: 'Module 13',
                        title: 'Queue',
                        duration: 'Core',
                        topics: [
                            'Queue Concept & Implementation',
                            'Circular Queue & Deque Basics'
                        ]
                    },
                    {
                        moduleNumber: 'Module 14',
                        title: 'Two Pointer & Sliding Window',
                        duration: 'Core',
                        topics: [
                            'Two Pointer Technique (Opposite Ends & Same Direction)',
                            'Sliding Window Technique (Fixed & Dynamic Window)',
                            'Prefix Sum Basics & Subarray Problems'
                        ]
                    },
                    {
                        moduleNumber: 'Module 15',
                        title: 'Backtracking',
                        duration: 'Core',
                        topics: [
                            'Subsets & Permutations Generation',
                            'Basic Grid & Matrix Path Backtracking'
                        ]
                    }
                ]
            }
        ]
    }
];

export default programsData;
