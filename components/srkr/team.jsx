'use client'
import React, { useState } from 'react';
import teamData from './team-data';

const Team = () => {
    const [selectedMember, setSelectedMember] = useState(null);

    const openModal = (member) => setSelectedMember(member);
    const closeModal = () => setSelectedMember(null);

    return (
        <>
            <section id="team" className="srkr-team">
                <div className="srkr-team-container">
                    <div className="srkr-section-title" data-sal="slide-up" data-sal-delay="100" data-sal-duration="800">
                        {/* <span className="srkr-section-badge">👥 Our Team</span> */}
                        <h2>Meet the <span>Team</span></h2>
                        <p>
                            Passionate educators and industry professionals dedicated 
                            to shaping the next generation of tech leaders.
                        </p>
                    </div>

                    <div className="srkr-team-grid">
                        {teamData.map((member, index) => (
                            <div
                                key={member.id}
                                className="srkr-team-card"
                                data-sal="slide-up"
                                data-sal-delay={`${150 + index * 100}`}
                                data-sal-duration="800"
                                onClick={() => openModal(member)}
                            >
                                <div className="srkr-team-photo">
                                    <img src={member.photo} alt={member.name} />
                                </div>
                                <div className="srkr-team-info">
                                    <h4>{member.name}</h4>
                                    <div className="srkr-team-role">{member.role}</div>
                                    <p>{member.shortBio}</p>
                                </div>
                                {member.linkedin && member.linkedin !== '#' && (
                                    <div className="srkr-team-social">
                                        <a
                                            href={member.linkedin}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            onClick={(e) => e.stopPropagation()}
                                            aria-label={`${member.name} LinkedIn`}
                                        >
                                            in
                                        </a>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Team Member Detail Modal */}
            <div
                className={`srkr-modal-overlay ${selectedMember ? 'open' : ''}`}
                onClick={closeModal}
            >
                {selectedMember && (
                    <div className="srkr-modal-content" onClick={(e) => e.stopPropagation()}>
                        <button className="srkr-modal-close" onClick={closeModal}>✕</button>
                        <img
                            className="srkr-modal-photo"
                            src={selectedMember.photo}
                            alt={selectedMember.name}
                        />
                        <h3>{selectedMember.name}</h3>
                        <div className="srkr-modal-role">{selectedMember.role}</div>
                        <div className="srkr-modal-bio">
                            <p>{selectedMember.fullBio}</p>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default Team;
