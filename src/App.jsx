import React from 'react';
import { motion } from 'framer-motion';
import { 
  Code2, 
  Terminal, 
  Cpu, 
  BrainCircuit, 
  MessageCircle, 
  ChevronDown, 
  ExternalLink,
  Mail,
  Layers,
  Globe,
  Camera,
  Box,
  Shield,
  Mouse // הוספתי אייקון עכבר לאפקט
} from 'lucide-react';

// --- Animations Configuration ---
const fadeInUp = {
  hidden: { opacity: 0, y: 60 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.6, ease: "easeOut" } 
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2
    }
  }
};

// --- DATA LISTS ---

const projects = [
  {
    title: "Yoga App Management",
    description: "A comprehensive management system for yoga instructors and students. Features class scheduling, user management, and attendance tracking.",
    tags: ["Full Stack", "Management System", "UX/UI"],
    links: [{ label: "View Source", url: "https://github.com/roni5604/YogaTime" }],
    image: "/images/YogaApp.png",
    icon: <Layers size={20} />
  },
  {
    title: "Face Recognition Model",
    description: "Deep learning model for real-time emotion detection and identity classification. High-accuracy computer vision implementation.",
    tags: ["Python", "Deep Learning", "Computer Vision"],
    links: [{ label: "View Model", url: "https://github.com/roni5604/face_recognition_model" }],
    image: "/images/face_rec.png",
    icon: <Camera size={20} />
  },
  {
    title: "Blockchain Voting System",
    description: "A decentralized voting platform ensuring transparency and immutability. Uses blockchain technology to prevent vote tampering.",
    tags: ["Blockchain", "Security", "Smart Contracts"],
    links: [{ label: "View System", url: "https://github.com/roni5604/company-voting-system" }],
    image: "/images/blockchain.png",
    icon: <Box size={20} />
  },
  {
    title: "Professional Web Development",
    description: "A portfolio of commercial websites built for clients. Includes e-commerce solutions, restaurant landing pages, and personal portfolios.",
    tags: ["Web Design", "HTML/CSS", "Client Work"],
    links: [
      { label: "Meat & Cheese", url: "https://roni5604.github.io/meatandcheese/index.html" },
      { label: "Hapshuta", url: "https://hapshuta.com/" },
      { label: "Matan Refaely", url: "https://matanrefaely.com/" }
    ],
    image: "/images/web_dev.png",
    icon: <Globe size={20} />
  },
  {
    title: "Autonomous Drone Navigation",
    description: "Developed advanced navigation algorithms for both 2D and 3D environments, enabling drones to detect obstacles and plan paths autonomously.",
    tags: ["Robotics", "Algorithms", "Simulation"],
    links: [
      { label: "2D Simulation", url: "https://github.com/roni5604/Model_2D_drone_simulator" },
      { label: "3D Simulator", url: "https://github.com/roni5604/Drone_Simulator_final_project" }
    ],
    image: "/images/drone.png",
    icon: <Cpu size={20} />
  }
];

const faqs = [
  { 
    q: "Why hire a Math & CS graduate?", 
    a: "My background isn't just coding—it's problem-solving. The combination of high-level mathematics and computer science allows me to approach complex algorithms and backend logic with a depth that standard bootcamps can't match." 
  },
  { 
    q: "Are you ready for a full-time Full Stack role?", 
    a: "100%. While I have been tutoring, I have spent every spare hour building real-world projects (like the Drone Simulator and Face Recognition model). I am hungry for a challenge and ready to commit long-term to a strong technical team." 
  },
  { 
    q: "How fast can you learn new technologies?", 
    a: "Extremely fast. My portfolio—ranging from Blockchain to Deep Learning to React—proves my ability to adapt. I don't just wait for instructions; I research, I build, and I solve problems independently." 
  },
  {
    q: "How do you handle high-pressure environments?",
    a: "My military service as an Operations Room Manager taught me to stay calm and focused under extreme pressure. I know how to prioritize tasks, manage time efficiently, and deliver results when it counts."
  },
  {
    q: "Does your tutoring experience help in development?",
    a: "It is a huge advantage. Teaching requires breaking down complex logic into simple, understandable steps. This makes me a better communicator, a cleaner coder, and a more effective team player."
  },
  {
    q: "Do you prefer Backend or Frontend?",
    a: "I am a builder who enjoys the entire process. While I excel at complex Backend logic (C#, Python), I also love crafting smooth user experiences in React. I take pride in owning a feature from the database all the way to the UI."
  }
];

// --- REUSABLE COMPONENTS ---

const Section = ({ children, id, className = "" }) => (
  <section id={id} className={`py-20 px-6 md:px-20 ${className}`}>
    {children}
  </section>
);

const Card = ({ children, className = "" }) => (
  <motion.div 
    variants={fadeInUp}
    className={`bg-slate-800/50 backdrop-blur-lg border border-slate-700 p-6 rounded-2xl hover:border-slate-500 transition-colors duration-300 ${className}`}
  >
    {children}
  </motion.div>
);

// --- MAIN APP COMPONENT ---

export default function App() {
  return (
    <div className="font-sans text-slate-200 selection:bg-cyan-500 selection:text-white">
      
      {/* 1. HERO SECTION */}
      <section className="h-screen flex flex-col justify-center items-center text-center relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-cyan-500/20 rounded-full blur-[100px] -z-10" />
        
        <motion.div 
          initial="hidden" 
          animate="visible" 
          variants={staggerContainer}
          className="z-10"
        >
          <motion.h2 variants={fadeInUp} className="text-cyan-400 font-medium tracking-widest uppercase mb-4">
            Full Stack Developer & Mathematician
          </motion.h2>
          <motion.h1 variants={fadeInUp} className="text-6xl md:text-8xl font-bold text-white mb-6 tracking-tight">
            Roni Michaeli
          </motion.h1>
          <motion.p variants={fadeInUp} className="text-xl md:text-2xl text-slate-400 max-w-2xl mx-auto mb-10">
            Turning complex algorithms into efficient code.
            <br />
            B.Sc. Graduate | Private Tutor | Coder
          </motion.p>
          
          <motion.div variants={fadeInUp} className="flex gap-4 justify-center">
            <a href="#contact" className="px-8 py-3 bg-white text-slate-900 rounded-full font-bold hover:bg-cyan-500 hover:text-white transition-all duration-300">
              Hire Me
            </a>
            <a href="#projects" className="px-8 py-3 border border-slate-600 rounded-full font-medium hover:border-white transition-all duration-300">
              View Projects
            </a>
          </motion.div>
        </motion.div>

        {/* --- SCROLL INDICATOR WITH EFFECTS --- */}
        <motion.a 
          href="#about"
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          transition={{ delay: 1.5, duration: 1 }}
          className="absolute bottom-10 flex flex-col items-center gap-3 cursor-pointer group"
        >
          {/* Animated Mouse Icon */}
          <div className="w-[30px] h-[50px] border-2 border-slate-400 rounded-full flex justify-center pt-2 group-hover:border-cyan-400 transition-colors duration-300">
            <motion.div 
              animate={{ y: [0, 15, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, repeatType: "loop", ease: "easeInOut" }}
              className="w-1.5 h-1.5 bg-cyan-400 rounded-full"
            />
          </div>

          {/* Double Arrows with Hover Effect */}
          <div className="flex flex-col items-center -mt-2 space-y-[-10px]">
            <ChevronDown size={24} className="text-slate-500 group-hover:text-white transition-colors duration-300 animate-bounce" />
            <ChevronDown size={24} className="text-slate-700 group-hover:text-cyan-500 transition-colors duration-300" />
          </div>
        </motion.a>

      </section>

      {/* 2. ABOUT ME SECTION (Bento Grid) */}
      <Section id="about">
        <motion.div 
          initial="hidden" 
          whileInView="visible" 
          viewport={{ once: true, amount: 0.1 }} 
          variants={staggerContainer}
          className="max-w-6xl mx-auto"
        >
          <motion.h3 variants={fadeInUp} className="text-4xl font-bold mb-12 border-l-4 border-cyan-500 pl-6">
            About Me
          </motion.h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* CARD 1: Profile Photo & Core Identity */}
            <Card className="md:col-span-1 md:row-span-2 flex flex-col items-center text-center bg-gradient-to-b from-slate-800 to-slate-900">
              <div className="w-48 h-48 rounded-full overflow-hidden border-4 border-cyan-500/30 mb-6 shadow-2xl bg-slate-800">
                <img 
                  src="images/roniProfile.png"
                  onError={(e) => {e.target.src = 'https://placehold.co/400x400/1e293b/cbd5e1?text=Roni+Photo'}}
                  alt="Roni Michaeli" 
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="text-2xl font-bold text-white">Roni Michaeli</h3>
              <p className="text-cyan-400 font-mono text-sm mb-4">B.Sc. Computer Science & Math</p>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">
                "I have a passion for self-learning complex topics and a drive to complete every task end-to-end."
              </p>
              <div className="w-full mt-auto pt-4 border-t border-slate-700">
                <div className="flex justify-between text-xs text-slate-500 uppercase tracking-wider">
                  <span>Residence</span>
                  <span className="text-white">Israel</span>
                </div>
                <div className="flex justify-between text-xs text-slate-500 uppercase tracking-wider mt-2">
                  <span>Status</span>
                  <span className="text-green-400">Open to Work</span>
                </div>
              </div>
            </Card>

            {/* CARD 2: Bio / The Pitch */}
            <Card className="md:col-span-2">
              <div className="flex items-start gap-4">
                <Terminal className="text-purple-500 mt-1" size={32} />
                <div>
                  <h4 className="text-xl font-bold text-white mb-2">The Coder & The Tutor</h4>
                  <p className="text-slate-400 leading-relaxed">
                    I am a graduate of <b>Ariel University</b> with a B.Sc. in Computer Science and Mathematics. 
                    Currently, I work as a private tutor, preparing university students for complex exams and mentoring the next generation of developers.
                    <br /><br />
                    However, my true passion lies in building systems. I am looking for my next challenge as a <b>Full Stack or Backend Developer</b>. 
                    I bring a unique combination of deep mathematical understanding, algorithmic thinking, and the ability to learn new technologies at record speed.
                  </p>
                </div>
              </div>
            </Card>

            {/* CARD 3: Technical Arsenal */}
            <Card className="md:col-span-2">
              <h4 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Cpu className="text-blue-500" /> Technical Arsenal
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  "C / C++", "C# & .NET", "Java", "Python (ML/DL)",
                  "JavaScript", "React", "Firebase", "SQL / NoSQL"
                ].map((tech) => (
                  <div key={tech} className="bg-slate-900/50 border border-slate-700 rounded p-2 text-center text-sm font-mono text-cyan-300 hover:bg-cyan-500/20 transition-colors cursor-default">
                    {tech}
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-4 border-t border-slate-700/50">
                <p className="text-sm text-slate-500">
                  <span className="text-white font-bold">Also experienced in:</span> Blockchain (MetaMask), Android (Kotlin/XML), Git/GitHub, Data Structures & Algorithms.
                </p>
              </div>
            </Card>

            {/* CARD 4: Military Service */}
            <Card className="md:col-span-1 bg-slate-800/80">
               <h4 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                <Shield className="text-green-500" size={20} /> Military Service
              </h4>
              <p className="text-slate-400 text-sm mb-2">
                <b>2017-2021:</b> Managed a 24/7 war room at a high-risk base.
              </p>
              <ul className="text-slate-500 text-xs space-y-2 list-disc pl-4">
                <li>Managed security systems (Motorola, Eldor).</li>
                <li>Responsible for rapid response to threats.</li>
                <li>Proven ability to function under high pressure.</li>
              </ul>
            </Card>

             {/* CARD 5: Stats */}
             <Card className="md:col-span-2 flex items-center justify-between gap-4">
                <div className="text-center w-1/3">
                  <h5 className="text-3xl font-bold text-white">B.Sc.</h5>
                  <span className="text-xs text-slate-500 uppercase">CS & Math</span>
                </div>
                <div className="h-10 w-[1px] bg-slate-700"></div>
                 <div className="text-center w-1/3">
                  <h5 className="text-3xl font-bold text-white">5+</h5>
                  <span className="text-xs text-slate-500 uppercase">Languages</span>
                </div>
                <div className="h-10 w-[1px] bg-slate-700"></div>
                 <div className="text-center w-1/3">
                  <h5 className="text-3xl font-bold text-white">100%</h5>
                  <span className="text-xs text-slate-500 uppercase">Commitment</span>
                </div>
            </Card>

          </div>
        </motion.div>
      </Section>

      {/* 3. SELECTED PROJECTS SECTION */}
      <Section id="projects" className="bg-slate-900/50">
        <div className="max-w-6xl mx-auto">
          <motion.div
             initial={{ opacity: 0, x: -50 }} 
             whileInView={{ opacity: 1, x: 0 }} 
             viewport={{ once: true, amount: 0.1 }}
             className="mb-12"
          >
            <h3 className="text-4xl font-bold border-l-4 border-cyan-500 pl-6">Selected Projects</h3>
            <p className="text-slate-400 mt-4 pl-6 max-w-2xl">
              A collection of my technical work, ranging from deep learning models to commercial web platforms.
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {projects.map((project, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true, margin: "-50px" }}
                className="group relative h-full"
              >
                <div className="bg-slate-800 rounded-2xl overflow-hidden h-full border border-slate-700 hover:border-cyan-500/50 transition-all duration-500 hover:shadow-2xl hover:shadow-cyan-500/10 flex flex-col">
                  
                  {/* Image Area with Zoom Effect */}
                  <div className="h-48 overflow-hidden relative">
                    <div className="absolute inset-0 bg-slate-900/20 group-hover:bg-transparent transition-colors z-10" />
                    <img 
                      src={project.image} 
                      alt={project.title}
                      className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute top-4 right-4 bg-slate-900/80 backdrop-blur p-2 rounded-lg z-20 text-cyan-400">
                      {project.icon}
                    </div>
                  </div>

                  {/* Content Area */}
                  <div className="p-6 flex flex-col flex-grow">
                    <h4 className="text-xl font-bold mb-3 group-hover:text-cyan-400 transition-colors">{project.title}</h4>
                    <p className="text-slate-400 mb-6 text-sm leading-relaxed flex-grow">{project.description}</p>
                    
                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mb-6">
                      {project.tags.map(tag => (
                        <span key={tag} className="text-xs font-mono bg-slate-900 border border-slate-700 px-2 py-1 rounded text-slate-300">
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Links Buttons */}
                    <div className="flex flex-wrap gap-3 mt-auto pt-4 border-t border-slate-700/50">
                      {project.links.map((link, idx) => (
                        <a 
                          key={idx}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider bg-cyan-500/10 hover:bg-cyan-500 text-cyan-400 hover:text-white px-4 py-2 rounded-lg transition-all"
                        >
                          {link.label} <ExternalLink size={14} />
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* 4. FAQ SECTION */}
      <Section id="faq">
        <div className="max-w-3xl mx-auto">
          <h3 className="text-3xl font-bold mb-10 text-center">Frequently Asked Questions</h3>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="bg-slate-800 rounded-lg p-6 border-l-4 border-purple-500"
              >
                <h4 className="font-bold text-lg mb-2">{faq.q}</h4>
                <p className="text-slate-400">{faq.a}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* 5. FOOTER & CONTACT */}
      <footer id="contact" className="py-20 border-t border-slate-800 relative">
        <div className="max-w-4xl mx-auto text-center px-6">
          <h2 className="text-4xl md:text-5xl font-bold mb-8">Let's work together.</h2>
          <p className="text-xl text-slate-400 mb-12">
            I am currently open for full-time developer roles.<br/>
            Let's discuss how I can contribute to your team.
          </p>
          
          <div className="flex flex-col md:flex-row gap-6 justify-center items-center">
            <a 
              href="https://wa.me/972544396677" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-3 bg-green-600 hover:bg-green-500 text-white px-8 py-4 rounded-full font-bold text-lg transition-all hover:scale-105 shadow-lg shadow-green-900/20"
            >
              <MessageCircle size={24} />
              WhatsApp Me
            </a>
            
            <a 
              href="mailto:Roniro5604@gmail.com" 
              className="flex items-center gap-3 bg-slate-800 hover:bg-slate-700 text-white px-8 py-4 rounded-full font-bold text-lg transition-all"
            >
              <Mail size={24} />
              Roniro5604@gmail.com
            </a>
          </div>

          <div className="mt-20 text-slate-600 text-sm">
            © 2025 Roni Michaeli. Built with React & Tailwind.
          </div>
        </div>
      </footer>
    </div>
  );
}