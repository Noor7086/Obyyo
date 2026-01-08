import React, { useState } from 'react';

const FAQ: React.FC = () => {
  const [openItems, setOpenItems] = useState<number[]>([]);

  const toggleItem = (index: number) => {
    setOpenItems(prev => 
      prev.includes(index) 
        ? prev.filter(item => item !== index)
        : [...prev, index]
    );
  };

  const faqData = [
    {
      question: "How accurate are Obyyo's lottery predictions?",
      answer: "Our prediction system achieves 95%+ accuracy in identifying non-viable numbers. This means we can help you avoid numbers that are statistically unlikely to be drawn, improving your overall odds of winning."
    },
    {
      question: "What lottery games does Obyyo support?",
      answer: "We support all major lottery games including Powerball, Mega Millions, Lotto America, Gopher 5, and Pick 3. Our system continuously analyzes patterns for each specific lottery to provide the most accurate predictions."
    },
    {
      question: "How does the prediction system work?",
      answer: "Our advanced algorithms analyze historical lottery data, number frequency patterns, hot and cold numbers, and statistical trends. The system identifies numbers that are statistically unlikely to be drawn in upcoming games."
    },
    {
      question: "Is there a guarantee that I will win?",
      answer: "No lottery prediction system can guarantee wins. However, our service helps you make more informed decisions by identifying numbers with lower probability, potentially improving your overall success rate and reducing wasted spending on unlikely combinations."
    },
    {
      question: "How much does the service cost?",
      answer: "We offer flexible pricing starting at $1 per prediction for individual lottery games. No hidden fees or long-term commitments required."
    },
    {
      question: "How do I receive my predictions?",
      answer: "You can access predictions through our web dashboard, and we also send real-time notifications when new predictions are available for your selected lottery games. All predictions are delivered instantly after analysis is complete."
    },
    {
      question: "Can I use the number generator with the predictions?",
      answer: "Yes! Our smart number generator works in conjunction with our predictions. It generates optimal number combinations using only the viable numbers identified by our system, maximizing your chances of success."
    },
    {
      question: "Is my personal information secure?",
      answer: "Absolutely. We use bank-level encryption and security protocols to protect your personal data and payment information. We never share your information with third parties and follow strict privacy standards."
    },
    {
      question: "What if I'm not satisfied with the service?",
      answer: "We offer a 7-day free trial for new users. If you're not completely satisfied, you can cancel anytime with no questions asked. We're committed to providing value to our users."
    },
    {
      question: "How often are predictions updated?",
      answer: "Predictions are updated daily for each lottery game, typically 2-4 hours after the drawing. Our system continuously monitors and analyzes new data to ensure you receive the most current and accurate predictions."
    },
    {
      question: "Can I track my prediction success rate?",
      answer: "Yes! Our dashboard includes detailed analytics showing your prediction accuracy, success rates, and lottery results. You can track your performance over time and see how our service is helping improve your lottery strategy."
    },
    {
      question: "Do you offer customer support?",
      answer: "We provide 24/7 customer support through email and live chat. Our team is always ready to help with any questions or technical issues."
    },
    {
      question: "How many numbers are predicted per each lottery game?",
      answer: "There is no define numbers of prediction for any lottery game. The total numbers of prediction are based on the result of analysis"
    }
  ];

  return (
    <div className="container py-5 mt-5">
      <div className="row">
        <div className="col-lg-8 mx-auto">
          <div className="text-center mb-5">
            <h1 className="display-4 fw-bold mb-3 gradient-text">Frequently Asked Questions</h1>
            <p className="lead text-muted">
              Everything you need to know about Obyyo's lottery prediction technology
            </p>
          </div>

          <div className="accordion" id="faqAccordion">
            {faqData.map((item, index) => (
              <div key={index} className="accordion-item border-0 shadow-sm mb-3">
                <h2 className="accordion-header">
                  <button
                    className={`accordion-button ${openItems.includes(index) ? '' : 'collapsed'} fw-bold`}
                    type="button"
                    onClick={() => toggleItem(index)}
                    style={{
                      backgroundColor: openItems.includes(index) ? 'var(--primary-color)' : 'white',
                      color: openItems.includes(index) ? 'white' : 'var(--gray-800)',
                      border: 'none',
                      borderRadius: '10px'
                    }}
                  >
                    <i className={`bi bi-${openItems.includes(index) ? 'dash-circle' : 'plus-circle'} me-3`}></i>
                    {item.question}
                  </button>
                </h2>
                <div className={`accordion-collapse collapse ${openItems.includes(index) ? 'show' : ''}`}>
                  <div className="accordion-body p-4">
                    <p className="mb-0 lh-lg">{item.answer}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-5">
            <div className="card border-0 shadow-sm">
              <div className="card-body p-4">
                <h5 className="fw-bold mb-3">Still have questions?</h5>
                <p className="text-muted mb-3">
                  Our support team is here to help you get the most out of Obyyo's prediction technology.
                </p>
                <div className="d-flex flex-wrap gap-3 justify-content-center">
                  <a href="/contact" className="btn btn-primary">
                    <i className="bi bi-envelope me-2"></i>
                    Contact Support
                  </a>
                  <a href="/how-it-works" className="btn btn-outline-primary">
                    <i className="bi bi-question-circle me-2"></i>
                    How It Works
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FAQ;

