import React, { useState } from 'react';
import Layout from './components/Layout';
import Home from './components/Home';
import Itinerary from './components/Itinerary';
import Logistics from './components/Logistics';
import PhotoLab from './components/PhotoLab';
import Games from './components/Games';
import MapView from './components/MapView';
import Profile from './components/Profile';
import { ViewState } from './types';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.HOME);

  const renderView = () => {
    switch (currentView) {
      case ViewState.HOME:
        return <Home setView={setCurrentView} />;
      case ViewState.ITINERARY:
        return <Itinerary />;
      case ViewState.LOGISTICS:
        return <Logistics />;
      case ViewState.PHOTO_LAB:
        return <PhotoLab />;
      case ViewState.GAMES:
        return <Games />;
      case ViewState.MAP:
        return <MapView />;
      case ViewState.PROFILE:
        return <Profile />;
      default:
        return <Home setView={setCurrentView} />;
    }
  };

  return (
    <Layout currentView={currentView} setView={setCurrentView}>
      {renderView()}
    </Layout>
  );
};

export default App;