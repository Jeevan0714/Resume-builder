// Simulated job intelligence — rich mock data with realistic descriptions
const MOCK_JOBS = [
  {
    id: 'job-001',
    title: 'Senior Frontend Engineer',
    company: 'Vercel',
    location: 'Remote',
    type: 'Full-time',
    salary: '$140k – $190k',
    posted: '2 days ago',
    logo: '▲',
    skills: ['React', 'TypeScript', 'Next.js', 'Node.js', 'CSS', 'Performance Optimization', 'Web Vitals'],
    description: 'Join Vercel to build the future of the web. You will own critical parts of the Vercel dashboard, ship major user-facing features, and deeply collaborate with design and infrastructure teams. We move fast and deploy constantly.',
  },
  {
    id: 'job-002',
    title: 'Full Stack Developer',
    company: 'Linear',
    location: 'San Francisco, CA',
    type: 'Full-time',
    salary: '$130k – $170k',
    posted: '1 day ago',
    logo: '◈',
    skills: ['React', 'GraphQL', 'TypeScript', 'PostgreSQL', 'Node.js', 'Electron', 'Figma'],
    description: 'At Linear, software teams move faster. As a full-stack engineer, you will build features used by engineering teams at thousands of companies. You care deeply about craft, performance, and UX.',
  },
  {
    id: 'job-003',
    title: 'AI/ML Engineer',
    company: 'Groq',
    location: 'Remote',
    type: 'Full-time',
    salary: '$160k – $220k',
    posted: '3 days ago',
    logo: '⚡',
    skills: ['Python', 'PyTorch', 'LLM', 'CUDA', 'FastAPI', 'Transformers', 'MLOps'],
    description: 'Build the fastest AI inference infrastructure in the world. You will work on cutting-edge LLM deployment, model optimization, and real-time inference pipelines at massive scale.',
  },
  {
    id: 'job-004',
    title: 'Backend Engineer – Distributed Systems',
    company: 'PlanetScale',
    location: 'Remote',
    type: 'Full-time',
    salary: '$135k – $185k',
    posted: '4 days ago',
    logo: '🪐',
    skills: ['Go', 'MySQL', 'Kubernetes', 'gRPC', 'Distributed Systems', 'Docker', 'Cloud Infrastructure'],
    description: 'PlanetScale is the world\'s most scalable MySQL-compatible serverless database. We need passionate backend engineers to design and build our next-generation distributed storage engine.',
  },
  {
    id: 'job-005',
    title: 'Product Designer',
    company: 'Figma',
    location: 'New York, NY',
    type: 'Full-time',
    salary: '$120k – $160k',
    posted: '5 days ago',
    logo: '◉',
    skills: ['Figma', 'Product Design', 'UX Research', 'Prototyping', 'Design Systems', 'Accessibility'],
    description: 'Help millions of designers and developers collaborate. You will design core features of Figma, run user research, and partner directly with engineering to ship polished, delightful experiences.',
  },
  {
    id: 'job-006',
    title: 'DevOps / Platform Engineer',
    company: 'Stripe',
    location: 'Remote',
    type: 'Full-time',
    salary: '$145k – $195k',
    posted: '6 days ago',
    logo: 'S',
    skills: ['Kubernetes', 'Terraform', 'AWS', 'CI/CD', 'Python', 'Docker', 'Observability', 'SLO/SLA'],
    description: 'Stripe\'s mission is to increase the GDP of the internet. As a platform engineer, you\'ll build and operate the infrastructure that processes billions of API calls every year, ensuring 99.999% availability.',
  },
  {
    id: 'job-007',
    title: 'Data Scientist',
    company: 'Notion',
    location: 'San Francisco, CA',
    type: 'Full-time',
    salary: '$130k – $165k',
    posted: '1 week ago',
    logo: 'N',
    skills: ['Python', 'SQL', 'Machine Learning', 'Statistics', 'A/B Testing', 'dbt', 'Looker'],
    description: 'Use data to help 30M+ people be more productive. You will analyze user behavior, build ML models that power AI features, and partner with product teams to define the metrics that shape Notion\'s roadmap.',
  },
  {
    id: 'job-008',
    title: 'React Native Engineer',
    company: 'Expo',
    location: 'Remote',
    type: 'Full-time',
    salary: '$110k – $155k',
    posted: '3 days ago',
    logo: '📱',
    skills: ['React Native', 'JavaScript', 'TypeScript', 'iOS', 'Android', 'Expo SDK', 'Native Modules'],
    description: 'Build the tooling that empowers 1M+ mobile developers. You will work on the Expo SDK, EAS Build, and the next generation of cross-platform development tools used by millions worldwide.',
  },
]

/**
 * Score a job against a user's resume text by counting keyword overlaps.
 */
function computeMatchScore(jobSkills, resumeText) {
  if (!resumeText) return Math.floor(Math.random() * 30) + 50 // default range if no resume
  const lower = resumeText.toLowerCase()
  const matches = jobSkills.filter(s => lower.includes(s.toLowerCase()))
  return Math.round((matches.length / jobSkills.length) * 100)
}

exports.getFeed = async (req, res) => {
  try {
    const { search = '', type = 'all', minScore = 0 } = req.query

    // Optionally fetch user resume for scoring
    let resumeText = ''
    try {
      const { db } = require('../config/firebase')
      const snap = await db.collection('users').doc(req.user.uid)
        .collection('master_profiles').doc('latest').get()
      if (snap.exists) resumeText = snap.data().rawText || ''
    } catch (_) {}

    let jobs = MOCK_JOBS.map(job => ({
      ...job,
      matchScore: computeMatchScore(job.skills, resumeText),
    }))

    // Filters
    if (search) {
      const q = search.toLowerCase()
      jobs = jobs.filter(j =>
        j.title.toLowerCase().includes(q) ||
        j.company.toLowerCase().includes(q) ||
        j.skills.some(s => s.toLowerCase().includes(q))
      )
    }
    if (type !== 'all') jobs = jobs.filter(j => j.type.toLowerCase() === type.toLowerCase())
    jobs = jobs.filter(j => j.matchScore >= parseInt(minScore, 10))

    // Sort by match score descending
    jobs.sort((a, b) => b.matchScore - a.matchScore)

    res.json({ jobs, total: jobs.length })
  } catch (err) {
    console.error('[Jobs Feed]', err)
    res.status(500).json({ error: err.message })
  }
}
