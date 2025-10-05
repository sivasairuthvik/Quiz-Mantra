import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Card } from '../../components/common';
import './HomePage.css';
import Navbar from '../../components/layout/Navbar';
import { publicAPI } from '../../utils/api';

const HomePage = () => {
  const [contact, setContact] = useState({ name: '', email: '', message: '' });
  const [submitting, setSubmitting] = useState(false);

  const submitContact = async (e) => {
    e.preventDefault();
    if (!contact.name.trim() || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(contact.email) || contact.message.trim().length < 10) {
      return alert('Please provide a valid name, email, and a message of at least 10 characters.');
    }
    try {
      setSubmitting(true);
      const res = await publicAPI.contact(contact);
      if (res.data?.success) {
        alert('Thanks! We received your message.');
        setContact({ name: '', email: '', message: '' });
      } else {
        alert(res.data?.message || 'Failed to send message');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to send message');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="home">
  <Navbar />
      {/* Hero Section */}
      <header className="hero">
        <div className="hero__bg" aria-hidden="true"></div>
        <div className="container hero__inner">
          <div className="hero__copy">
            <h1 className="hero__title">
              Master assessments with
              <span className="gradient-text"> AI precision</span>
            </h1>
            <p className="hero__subtitle">
              Create, assign, and analyze quizzes effortlessly. Harness Gemini AI to transform
              study materials into high‑quality questions in seconds.
            </p>
            <div className="hero__actions">
              <Link to="/register"><Button size="lg" icon={"✨"}>Get started</Button></Link>
              <Link to="/login"><Button size="lg" variant="secondary" icon={"▶"} iconPosition="right">Sign in</Button></Link>
            </div>
            <ul className="hero__trust">
              <li>🔒 Secure</li>
              <li>⚡ Fast</li>
              <li>📱 Responsive</li>
            </ul>
          </div>
          <div className="hero__visual">
            <div className="glass card-preview">
              <div className="card-preview__header">AI Generated Quiz</div>
              <div className="card-preview__body">
                <div className="chip">Multiple Choice</div>
                <div className="chip chip--success">Auto‑graded</div>
                <div className="card-preview__question">What is the time complexity of binary search?</div>
                <ul className="card-preview__options">
                  <li>O(n)</li>
                  <li className="active">O(log n)</li>
                  <li>O(n log n)</li>
                  <li>O(1)</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Stats Section */}
      <section id="features" className="stats">
        <div className="container stats__grid">
          <div className="stat">
            <div className="stat__value">10k+</div>
            <div className="stat__label">Quizzes created</div>
          </div>
          <div className="stat">
            <div className="stat__value">95%</div>
            <div className="stat__label">Faster authoring</div>
          </div>
          <div className="stat">
            <div className="stat__value">99.9%</div>
            <div className="stat__label">Uptime</div>
          </div>
          <div className="stat">
            <div className="stat__value">1M+</div>
            <div className="stat__label">Answers graded</div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <div className="container features__grid">
          <Card className="feature glass">
            <div className="feature__icon">🤖</div>
            <h3>AI Quiz Generation</h3>
            <p>Upload PDFs or content and generate varied, high‑quality questions instantly.</p>
          </Card>
          <Card className="feature glass">
            <div className="feature__icon">📊</div>
            <h3>Actionable Analytics</h3>
            <p>Visualize performance, track difficulty, and identify knowledge gaps.</p>
          </Card>
          <Card className="feature glass">
            <div className="feature__icon">🔄</div>
            <h3>Auto‑grading</h3>
            <p>Save hours with instant grading and feedback powered by smart rules.</p>
          </Card>
          <Card className="feature glass">
            <div className="feature__icon">🏆</div>
            <h3>Competitions</h3>
            <p>Boost engagement with live leaderboards and collaborative challenges.</p>
          </Card>
        </div>
      </section>

      {/* How It Works */}
      <section id="how" className="how">
        <div className="container how__grid">
          <div className="how__step">
            <span className="badge">1</span>
            <h4>Upload material</h4>
            <p>Import PDFs or paste content to seed your quiz.</p>
          </div>
          <div className="how__step">
            <span className="badge">2</span>
            <h4>Generate & refine</h4>
            <p>Let AI propose questions—edit, re‑roll, or approve.</p>
          </div>
          <div className="how__step">
            <span className="badge">3</span>
            <h4>Assign & analyze</h4>
            <p>Share with learners and track results in real time.</p>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="testimonials">
        <div className="container testimonials__grid">
          <Card className="testimonial glass">
            <p className="testimonial__quote">“Quiz Mantra cut our quiz prep time from hours to minutes.”</p>
            <div className="testimonial__author">— Priya, Teacher</div>
          </Card>
          <Card className="testimonial glass">
            <p className="testimonial__quote">“The analytics helped me focus revision where it mattered.”</p>
            <div className="testimonial__author">— Aditya, Student</div>
          </Card>
          <Card className="testimonial glass">
            <p className="testimonial__quote">“Auto‑grading is a game changer for our team.”</p>
            <div className="testimonial__author">— Kavya, Admin</div>
          </Card>
        </div>
      </section>

      {/* Final CTA + Contact */}
      <section id="contact" className="cta">
        <div className="container cta__inner glass">
          <h2>Start creating in minutes</h2>
          <p>Join educators and learners using AI to supercharge assessments.</p>
          <div className="cta__actions">
            <Link to="/register"><Button size="lg" icon={"🚀"}>Create free account</Button></Link>
            <Link to="/login"><Button size="lg" variant="secondary">I already have an account</Button></Link>
          </div>
          <form onSubmit={submitContact} className="contact-form" style={{ marginTop: 24 }}>
            <div className="grid-2">
              <input
                type="text"
                placeholder="Your name"
                value={contact.name}
                onChange={(e) => setContact({ ...contact, name: e.target.value })}
                required
              />
              <input
                type="email"
                placeholder="Email address"
                value={contact.email}
                onChange={(e) => setContact({ ...contact, email: e.target.value })}
                required
              />
            </div>
            <textarea
              placeholder="How can we help?"
              rows={4}
              value={contact.message}
              onChange={(e) => setContact({ ...contact, message: e.target.value })}
              required
            />
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Sending…' : 'Send message'}
              </Button>
            </div>
          </form>
        </div>
      </section>

      <footer className="footer">
        <div className="container footer__inner">
          <span>© {new Date().getFullYear()} Quiz Mantra</span>
          <nav className="footer__nav">
            <a href="/privacy">Privacy</a>
            <a href="/terms">Terms</a>
            <a href="#contact">Contact</a>
          </nav>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
