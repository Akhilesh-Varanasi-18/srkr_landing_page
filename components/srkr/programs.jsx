'use client'
import React from 'react';

const programsData = [
    {
        id: 'ignite',
        icon: '🔥',
        name: 'Ignite Coder',
        year: '1st Year',
        description: 'Build your coding foundation from scratch. Learn programming fundamentals, problem-solving techniques, and develop the mindset to think like a coder.',
        className: 'ignite',
    },
    {
        id: 'skillup',
        icon: '📈',
        name: 'SkillUp Coder',
        year: '2nd Year',
        description: 'Level up with intermediate data structures, algorithms, and project-based learning. Gain hands-on experience building real-world applications.',
        className: 'skillup',
    },
    {
        id: 'aiready',
        icon: '🤖',
        name: 'AI Ready Engineers',
        year: '3rd Year',
        description: 'Master AI, Machine Learning, and emerging technologies. Get industry-ready with advanced projects, certifications, and placement preparation.',
        className: 'aiready',
    },
    {
        id: 'owlcoder',
        icon: '🦉',
        name: 'Owl Coder',
        year: 'Expert Level',
        description: 'An exclusive program for coding champions. Tackle competitive programming, advanced algorithms, and system design to stand out from the crowd.',
        className: 'owlcoder',
    },
];

const Programs = () => {
    return (
        <section id="programs" className="srkr-programs">
            <div className="srkr-programs-container">
                <div className="srkr-section-title" data-sal="slide-up" data-sal-delay="100" data-sal-duration="800">
                    {/* <span className="srkr-section-badge">💻 Our Programs</span> */}
                    <h2>Programs We <span>Offer</span></h2>
                    <p>
                        Structured learning paths tailored for every stage of your engineering journey — 
                        from fundamentals to expert-level mastery.
                    </p>
                </div>

                <div className="srkr-programs-grid">
                    {programsData.map((program, index) => (
                        <div
                            key={program.id}
                            className={`srkr-program-card ${program.className}`}
                            data-sal="slide-up"
                            data-sal-delay={`${150 + index * 100}`}
                            data-sal-duration="800"
                        >
                            <div className="srkr-program-icon">
                                {program.icon}
                            </div>
                            <span className="srkr-program-year">{program.year}</span>
                            <h3>{program.name}</h3>
                            <p>{program.description}</p>
                            <a href="#" className="srkr-program-link">
                                Learn More <span>→</span>
                            </a>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Programs;
