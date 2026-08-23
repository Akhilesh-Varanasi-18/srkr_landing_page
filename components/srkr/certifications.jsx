'use client'
import React from 'react';

// Placeholder certifications — update logos/names when provided
const certifications = [
    { name: 'AWS', logo: '/assets/images/brand/aws.png' },
    { name: 'Google Cloud', logo: '/assets/images/brand/gcp.png' },
    { name: 'MongoDB', logo: '/assets/images/brand/mongodb.png' },
    { name: 'Red Hat', logo: '/assets/images/brand/redhat.png' },
    { name: 'Power BI', logo: '/assets/images/brand/powerbi.png' },
    { name: 'ServiceNow', logo: '/assets/images/brand/servicenow.png' },
    { name: 'Snowflake', logo: '/assets/images/brand/snowflake.png' },
    { name: 'Pega', logo: '/assets/images/brand/pega.png' },
];

const Certifications = () => {
    return (
        <section id="certifications" className="srkr-certifications">
            <div className="srkr-certifications-container">
                <div className="srkr-section-title" data-sal="slide-up" data-sal-delay="100" data-sal-duration="800">
                    {/* <span className="srkr-section-badge">🏆 Certifications</span> */}
                    <h2>Certifications We <span>Offer</span></h2>
                    <p>
                        Gain globally recognized certifications from industry leaders 
                        to boost your career prospects and stand out to employers.
                    </p>
                </div>

                <div className="srkr-cert-grid">
                    {certifications.map((cert, index) => (
                        <div
                            key={cert.name}
                            className="srkr-cert-card"
                            data-sal="slide-up"
                            data-sal-delay={`${100 + index * 50}`}
                            data-sal-duration="800"
                        >
                            <img src={cert.logo} alt={cert.name} />
                            <span>{cert.name}</span>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Certifications;
