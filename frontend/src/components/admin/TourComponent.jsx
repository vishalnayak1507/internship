import React from 'react';
import RealTourComponent from './RealTourComponent';
import '../../styles/TourStyles.css';

// This component acts as a facade for the tour component
// When Reactour is installed, this would directly use the Reactour library
// For now, we're using our placeholder implementation
const TourComponent = () => {
  return <RealTourComponent />;
};

export default TourComponent;
