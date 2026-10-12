import { ArrowRight, ArrowUpRight, Mail, Sparkles } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const contactEmail = 'ahmadrehan20102007@gmail.com';

const pages = {
  'for-academies': {
    eyebrow: 'A HOME FOR YOUR ACADEMY',
    title: 'Let the right learners find you.',
    intro: 'Bowan helps people discover learning opportunities and gives academies one place to introduce their courses, format, and story.',
    sections: [
      ['Show what makes you special', 'Build an academy profile with your story, subjects, location, and learning formats.'],
      ['Put your courses in reach', 'Share course details so learners can compare options and find a class that fits.'],
      ['Meet learners who are ready', 'Receive course applications and manage your academy workspace as your community grows.'],
    ],
    action: { label: 'Create an academy account', to: '/register?role=owner' },
  },
  contact: {
    eyebrow: 'WE’RE HERE TO HELP',
    title: 'Talk to our team.',
    intro: 'Have a question about finding a course, listing an academy, or using Bowan? Send us a note and we’ll be glad to hear from you.',
    sections: [
      ['Learners', 'Tell us what you’re looking for and we’ll help point you toward the right next step.'],
      ['Academies', 'Ask us about setting up your profile, adding courses, or managing applications.'],
      ['Email', contactEmail],
    ],
    action: { label: `Email ${contactEmail}`, href: `mailto:${contactEmail}` },
  },
  privacy: {
    eyebrow: 'THE IMPORTANT DETAILS',
    title: 'Privacy at Bowan.',
    intro: 'Bowan uses account and marketplace information to provide its learning discovery and academy workspace features.',
    sections: [
      ['Information you provide', 'When you register or use the service, Bowan processes details such as your name, email, account role, academy profile, course applications, saved academies, and reviews.'],
      ['How it is used', 'Information is used to operate accounts and workspaces, connect learners with academies, display marketplace listings, and support requests.'],
      ['Your questions', `For questions about information associated with your account, contact ${contactEmail}. This overview should be reviewed and expanded to reflect your final data-retention and legal requirements before launch.`],
    ],
  },
  terms: {
    eyebrow: 'USING THE MARKETPLACE',
    title: 'Bowan terms of use.',
    intro: 'Bowan helps learners discover academies and courses. Please use the service respectfully and keep your account information accurate.',
    sections: [
      ['Marketplace information', 'Course availability, pricing, admissions, schedules, and delivery are provided by the academy. Confirm current details with the academy before making a decision.'],
      ['Accounts and activity', 'Keep your sign-in details private and only submit content you have the right to share. Bowan may restrict accounts that misuse the service or disrupt other people.'],
      ['Learning arrangements', 'Applications made through Bowan help connect you with an academy. Enrollment decisions, instruction, and any payment arrangements are handled by the academy.'],
      ['Questions', `For help with these terms, email ${contactEmail}. These terms should receive legal review before production use.`],
    ],
  },
};

export default function InfoPage() {
  const { pathname } = useLocation();
  const page = pathname.slice(1);
  const content = pages[page];

  if (!content) return null;

  return <main className="site-info-page content-width">
    <header className="site-info-heading">
      <span className="eyebrow eyebrow-muted"><Sparkles size={14} /> {content.eyebrow}</span>
      <h1>{content.title}</h1>
      <p>{content.intro}</p>
    </header>
    <div className="site-info-sections">
      {content.sections.map(([title, body]) => <section className="site-info-card" key={title}>
        <h2>{title}</h2>
        <p>{body}</p>
        {title === 'Email' && <a href={`mailto:${contactEmail}`}>{contactEmail} <ArrowUpRight size={14} /></a>}
      </section>)}
    </div>
    <div className="site-info-actions">
      {content.action && (content.action.href
        ? <a className="button button-primary" href={content.action.href}>{content.action.label} <Mail size={15} /></a>
        : <Link className="button button-primary" to={content.action.to}>{content.action.label} <ArrowRight size={15} /></Link>)}
      <Link className="text-link" to="/">Back to Bowan <ArrowRight size={15} /></Link>
    </div>
  </main>;
}
