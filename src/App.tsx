import { useState } from 'react';
import './App.css';
import { useShoppingList, EMPTY_SECTIONS } from './hooks/useShoppingList';
import { useDeals }         from './hooks/useDeals';
import { SplashScreen }      from './components/SplashScreen';
import { ProductListScreen } from './components/ProductListScreen';

type Screen = 'splash' | 'list';

function App() {
  const [screen, setScreen] = useState<Screen>('splash');

  const { sections, toggleItem, addByTranscript, startNewList, deleteItem, reassignItem } =
    useShoppingList(EMPTY_SECTIONS);

  // Aanbiedingen ophalen zodra de lijst zichtbaar is
  const { getDeal, dealsLoading } = useDeals(screen === 'list' ? sections : []);

  if (screen === 'splash') {
    return (
      <SplashScreen
        onOpenList={() => setScreen('list')}
        onNewList={() => {
          startNewList();
          setScreen('list');
        }}
      />
    );
  }

  return (
    <ProductListScreen
      sections={sections}
      onToggleItem={toggleItem}
      onDeleteItem={deleteItem}
      onReassignItem={reassignItem}
      onAddByTranscript={addByTranscript}
      onNewList={startNewList}
      getDeal={getDeal}
      dealsLoading={dealsLoading}
      onBack={() => setScreen('splash')}
    />
  );
}

export default App;
