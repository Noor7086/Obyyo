import React, { useState } from 'react';

const Blog: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { id: 'all', name: 'All Posts', icon: '📚' },
    { id: 'strategy', name: 'Strategy', icon: '🎯' },
    { id: 'analysis', name: 'Analysis', icon: '📊' },
    { id: 'tips', name: 'Tips', icon: '💡' },
    { id: 'news', name: 'News', icon: '📰' }
  ];

  const blogPosts = [
    {
      id: 1,
      title: "Understanding Lottery Number Patterns: A Data-Driven Approach",
      excerpt: "Discover how we analyze historical lottery data to identify patterns and improve your winning chances.",
      content: "Our advanced algorithms have analyzed over 10 years of lottery data to identify key patterns...",
      category: 'analysis',
      author: 'Dr. Sarah Johnson',
      date: '2024-01-15',
      readTime: '8 min read',
      image: '📊',
      featured: true
    },
    {
      id: 2,
      title: "5 Proven Strategies to Maximize Your Lottery Success",
      excerpt: "Learn the most effective strategies used by successful lottery players to improve their odds.",
      content: "After analyzing thousands of winning tickets, we've identified five key strategies that consistently improve success rates...",
      category: 'strategy',
      author: 'Michael Chen',
      date: '2024-01-12',
      readTime: '6 min read',
      image: '🎯',
      featured: true
    },
    {
      id: 3,
      title: "The Science Behind Hot and Cold Numbers",
      excerpt: "Explore the statistical analysis of frequently and rarely drawn numbers across different lottery games.",
      content: "Hot and cold number analysis is one of the most misunderstood concepts in lottery strategy...",
      category: 'analysis',
      author: 'Emily Rodriguez',
      date: '2024-01-10',
      readTime: '7 min read',
      image: '🔥',
      featured: false
    },
    {
      id: 4,
      title: "How to Avoid Common Lottery Playing Mistakes",
      excerpt: "Learn about the most common mistakes lottery players make and how to avoid them.",
      content: "Many lottery players unknowingly make decisions that significantly reduce their chances of winning...",
      category: 'tips',
      author: 'David Thompson',
      date: '2024-01-08',
      readTime: '5 min read',
      image: '⚠️',
      featured: false
    },
    {
      id: 5,
      title: "Powerball vs Mega Millions: Which Offers Better Odds?",
      excerpt: "A comprehensive comparison of the two largest lottery games in the United States.",
      content: "Both Powerball and Mega Millions offer life-changing jackpots, but which game gives you better odds of winning?",
      category: 'analysis',
      author: 'Dr. Sarah Johnson',
      date: '2024-01-05',
      readTime: '9 min read',
      image: '⚡',
      featured: false
    },
    {
      id: 6,
      title: "Responsible Lottery Playing: Setting Limits and Budgets",
      excerpt: "Important guidelines for playing the lottery responsibly and within your means.",
      content: "Playing the lottery should be fun and exciting, but it's crucial to set limits and play responsibly...",
      category: 'tips',
      author: 'Michael Chen',
      date: '2024-01-03',
      readTime: '4 min read',
      image: '🛡️',
      featured: false
    },
    {
      id: 7,
      title: "New Technology Revolutionizes Lottery Predictions",
      excerpt: "Learn about the latest advances in technology that are changing how we approach lottery predictions.",
      content: "The field of lottery prediction has been revolutionized by new technologies...",
      category: 'news',
      author: 'Emily Rodriguez',
      date: '2024-01-01',
      readTime: '6 min read',
      image: '🤖',
      featured: true
    }
  ];

  const filteredPosts = selectedCategory === 'all' 
    ? blogPosts 
    : blogPosts.filter(post => post.category === selectedCategory);

  const featuredPosts = blogPosts.filter(post => post.featured);

  return (
    <div className="container py-5 mt-5">
      <div className="row">
        <div className="col-lg-8 mx-auto">
          <div className="text-center mb-5">
            <h1 className="display-4 fw-bold mb-3 gradient-text">Lottery Strategy Blog</h1>
            <p className="lead text-muted">
              Expert insights, analysis, and strategies to improve your lottery success
            </p>
          </div>

          {/* Featured Posts */}
          <div className="mb-5">
            <h3 className="fw-bold mb-4">
              <i className="bi bi-star me-2"></i>
              Featured Articles
            </h3>
            <div className="row g-4">
              {featuredPosts.map((post) => (
                <div key={post.id} className="col-md-6">
                  <div className="card h-100 border-0 shadow-sm">
                    <div className="card-body p-4">
                      <div className="d-flex align-items-center mb-3">
                        <span className="fs-1 me-3">{post.image}</span>
                        <div>
                          <span className="badge bg-primary mb-2">{post.category}</span>
                          <div className="small text-muted">
                            {post.author} • {post.date} • {post.readTime}
                          </div>
                        </div>
                      </div>
                      <h5 className="fw-bold mb-3">{post.title}</h5>
                      <p className="text-muted mb-3">{post.excerpt}</p>
                      <a href="#" className="btn btn-outline-primary">
                        Read More <i className="bi bi-arrow-right ms-1"></i>
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Category Filter */}
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-body p-4">
              <h5 className="fw-bold mb-3">
                <i className="bi bi-funnel me-2"></i>
                Filter by Category
              </h5>
              <div className="d-flex flex-wrap gap-2">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    className={`btn ${selectedCategory === category.id ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => setSelectedCategory(category.id)}
                  >
                    <span className="me-2">{category.icon}</span>
                    {category.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Blog Posts */}
          <div className="mb-5">
            <h3 className="fw-bold mb-4">
              <i className="bi bi-newspaper me-2"></i>
              {selectedCategory === 'all' ? 'All Articles' : categories.find(c => c.id === selectedCategory)?.name}
            </h3>
            <div className="row g-4">
              {filteredPosts.map((post) => (
                <div key={post.id} className="col-12">
                  <div className="card border-0 shadow-sm">
                    <div className="card-body p-4">
                      <div className="row align-items-center">
                        <div className="col-md-2 text-center">
                          <span className="fs-1">{post.image}</span>
                        </div>
                        <div className="col-md-10">
                          <div className="d-flex align-items-center mb-2">
                            <span className="badge bg-primary me-2">{post.category}</span>
                            <small className="text-muted">
                              {post.author} • {post.date} • {post.readTime}
                            </small>
                          </div>
                          <h5 className="fw-bold mb-2">{post.title}</h5>
                          <p className="text-muted mb-3">{post.excerpt}</p>
                          <a href="#" className="btn btn-outline-primary">
                            Read Full Article <i className="bi bi-arrow-right ms-1"></i>
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Newsletter Signup */}
          <div className="card border-0 shadow-sm bg-primary text-white">
            <div className="card-body p-4 text-center">
              <h5 className="fw-bold mb-3">
                <i className="bi bi-envelope me-2"></i>
                Stay Updated
              </h5>
              <p className="mb-4">
                Get the latest lottery strategies, analysis, and tips delivered to your inbox
              </p>
              <div className="row g-3 justify-content-center">
                <div className="col-md-6">
                  <input 
                    type="email" 
                    className="form-control" 
                    placeholder="Enter your email address"
                  />
                </div>
                <div className="col-md-3">
                  <button className="btn btn-light w-100">
                    Subscribe
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Blog;

