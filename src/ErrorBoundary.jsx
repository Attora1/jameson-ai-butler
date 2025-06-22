import { Component } from 'react';

export class JamesonErrorBoundary extends Component {
  state = { 
    hasError: false,
    errorMessage: '' 
  };

  static getDerivedStateFromError(error) {
    return { 
      hasError: true,
      errorMessage: error.toString() 
    };
  }

  componentDidCatch(error, info) {
    console.error("Jameson-tier Catastrophe:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="jameson-error">
          <h2>*clinks broken teacup*</h2>
          <p>Dreadfully sorry, sir. The {this.state.errorMessage} incident occurred.</p>
          <button onClick={() => this.setState({ hasError: false })}>
            Attempt Recovery
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}