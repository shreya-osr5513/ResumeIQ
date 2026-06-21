export const calculateSkillGap = (candidateSkills, jdSkills) => {
  const normalizedCandidateSkills = candidateSkills.map(s => s.toLowerCase().trim());
  const normalizedJdSkills = jdSkills.map(s => s.toLowerCase().trim());

  const matchedSkills = jdSkills.filter(skill => 
    normalizedCandidateSkills.includes(skill.toLowerCase().trim())
  );

  const missingSkills = jdSkills.filter(skill => 
    !normalizedCandidateSkills.includes(skill.toLowerCase().trim())
  );

  const recommendations = missingSkills.map(skill => `Learn and practice ${skill} in production environments`);

  return {
    matchedSkills,
    missingSkills,
    recommendations
  };
};
