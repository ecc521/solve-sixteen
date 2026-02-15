import { useState, useEffect } from 'react';
import { DndContext, DragOverlay, useSensor, useSensors, PointerSensor, TouchSensor, useDroppable } from '@dnd-kit/core';
import './styles/index.css';

import Slot from './components/Slot';
import WordCard from './components/WordCard';
import { shuffleArray } from './utils';
import faviconSvg from './assets/favicon.svg';

function App() {
  // words: All words definition match from server
  const [allWords, setAllWords] = useState([]);

  // gridState: Array of 16 slots. contains wordId or null.
  const [gridState, setGridState] = useState(Array(16).fill(null));

  // poolState: Array of wordIds currently in the pool.
  const [poolState, setPoolState] = useState([]);

  // solvedGroups: Array of solved categories
  const [solvedGroups, setSolvedGroups] = useState([]);

  const [activeId, setActiveId] = useState(null);
  const [message, setMessage] = useState('');
  const [availableDates, setAvailableDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor)
  );

  // Simplified API Base URL logic
  // Default to local emulator if env var is missing
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/solve-sixteen/us-central1';

  useEffect(() => {
    // Construct URL for available dates
    const datesUrl = `${apiBaseUrl}/getAvailableDates`;

    fetch(datesUrl)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setAvailableDates(data);
          if (data.length > 0) {
            setSelectedDate(data[0]); // Default to most recent
          }
        }
      })
      .catch(err => console.error("Failed to fetch available dates:", err));
  }, []);

  useEffect(() => {
    if (!selectedDate && availableDates.length > 0) return; // Wait for selection if we have dates

    // Construct URL for words
    let url = `${apiBaseUrl}/getWords`;
    if (selectedDate) {
      url += `?date=${selectedDate}`;
    }

    fetch(url)
      .then(res => res.json())
      .then(data => {
        setAllWords(data);
        // Initially all words are in the pool
        const ids = data.map(w => w.id);
        const shuffled = shuffleArray(ids);
        setPoolState(shuffled);
        // Reset grid and solved groups
        setGridState(Array(16).fill(null));
        setSolvedGroups([]);
        setMessage('');
      })
      .catch(err => console.error("Failed to fetch words:", err));
  }, [selectedDate]);

  const getWord = (id) => allWords.find(w => w.id === id);

  // Drag Handlers
  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const wordId = active.id;
    const overId = over.id; // 'slot-X' or 'pool'

    // Determine Source
    const sourceIndex = gridState.indexOf(wordId);
    const isFromPool = sourceIndex === -1;

    // Determine Destination
    if (overId === 'pool-area') {
      if (!isFromPool) {
        // Move back to pool
        const newGrid = [...gridState];
        newGrid[sourceIndex] = null;
        setGridState(newGrid);
        setPoolState([...poolState, wordId]);
      }
      return;
    }

    if (overId.startsWith('slot-')) {
      const destIndex = parseInt(overId.replace('slot-', ''), 10);
      const currentItemInDest = gridState[destIndex];

      if (sourceIndex === destIndex) return; // Same slot

      if (isFromPool) {
        // Pool -> Slot
        // If slot occupied, swap? Or reject? Let's swap if occupied, or just place.
        // If occupied, move occupied word back to pool? Or swap with dragged word?
        // "Swap" is friendlier but moving to pool is easier to implement.
        // Let's swap for best UX.

        const newGrid = [...gridState];
        newGrid[destIndex] = wordId;

        let newPool = poolState.filter(id => id !== wordId);
        if (currentItemInDest) {
          newPool.push(currentItemInDest);
        }

        setGridState(newGrid);
        setPoolState(newPool);

      } else {
        // Slot -> Slot
        const newGrid = [...gridState];
        newGrid[sourceIndex] = currentItemInDest; // Swap: if dest was null, source becomes null.
        newGrid[destIndex] = wordId;
        setGridState(newGrid);
      }
    }
  };

  // Click to move logic
  const handleCardClick = (wordId) => {
    // If in pool -> move to first empty slot
    // If in grid -> move to pool
    const gridIndex = gridState.indexOf(wordId);

    if (gridIndex === -1) {
      // In pool
      const firstEmptyIndex = gridState.indexOf(null);
      if (firstEmptyIndex !== -1) {
        const newGrid = [...gridState];
        newGrid[firstEmptyIndex] = wordId;
        setGridState(newGrid);
        setPoolState(poolState.filter(id => id !== wordId));
      } else {
        // Grid full
        setMessage("Grid is full!");
        setTimeout(() => setMessage(''), 1000);
      }
    } else {
      // In grid
      const newGrid = [...gridState];
      newGrid[gridIndex] = null;
      setGridState(newGrid);
      setPoolState([...poolState, wordId]);
    }
  };

  const handleSubmit = async () => {
    // Open NYT Connections in a new tab
    // Validating locally would likely be Copyright infringement. As-is, users are still required to visit the NYT website,
    // which minimizes any possible business impact. 
    window.open('https://www.nytimes.com/games/connections', '_blank');
    setMessage("You can verify the rows on the New York Times");
  };


  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      autoScroll={false}
    >
      <div className="game-container">
        <header>
          <h1 style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
            <img src={faviconSvg} alt="Solve Sixteen Logo" style={{ height: '1em' }} />
            Solve Sixteen
          </h1>
          <h2>Click or drag words into rows!</h2>
          <div style={{ margin: '10px 0' }}>
            <label htmlFor="date-select" style={{ marginRight: '10px' }}>Select Date:</label>
            <select
              id="date-select"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              disabled={availableDates.length === 0}
            >
              {availableDates.length === 0 && <option>Loading dates...</option>}
              {availableDates.map(date => (
                <option key={date} value={date}>{date}</option>
              ))}
            </select>
          </div>
        </header>

        {/* Solved Groups */}
        <div className="solved-area" style={{ width: '100%', maxWidth: '600px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {solvedGroups.map((group, i) => (
            <div key={i} className="solved-row" style={{ backgroundColor: getCategoryColor(group.category) }}>
              <div className="solved-title">{group.category}</div>
              <div className="solved-words">{group.items.join(', ')}</div>
            </div>
          ))}
        </div>

        {/* 4x4 Grid */}
        <div className="grid-area">
          {gridState.map((wordId, index) => (
            <Slot
              key={`slot-${index}`}
              id={`slot-${index}`}
              onClick={() => wordId && handleCardClick(wordId)}
            >
              {wordId ? (
                <WordCard
                  key={wordId}
                  id={wordId}
                  text={getWord(wordId)?.text}
                  category={getWord(wordId)?.category}
                />
              ) : null}
            </Slot>
          ))}
        </div>

        {/* Unplaced Area */}
        {solvedGroups.length < 4 && (
          <div
            id="pool-area"
            className="pool-area"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '8px',
              width: '100%',
              maxWidth: '600px',
              padding: '1rem 0 0 0',
            }}
          >
            <SortablePool words={poolState.map(id => getWord(id)).filter(Boolean)} onCardClick={handleCardClick} />
          </div>
        )}

        <div className="message">{message}</div>

        <div className="controls">
          <button onClick={handleSubmit}>Submit Rows</button>
          <button onClick={() => {
            // Return all to pool
            const idsInGrid = gridState.filter(Boolean);
            // Only move known valid IDs, ignore nulls
            setPoolState([...poolState, ...idsInGrid]);
            setGridState(Array(16).fill(null));
          }}>Reset</button>
        </div>

        <DragOverlay>
          {activeId ? (
            <WordCard
              id={activeId}
              text={getWord(activeId)?.text}
              isOverlay
            />
          ) : null}
        </DragOverlay>
      </div>
    </DndContext>
  );
}

// Separate component for Pool to useDroppable or just be a container
// For drag BACK to pool, the pool needs to be a droppable zone.
function SortablePool({ words, onCardClick }) {
  const { setNodeRef } = useDroppable({ id: 'pool-area' });
  return (
    <div ref={setNodeRef} style={{ display: 'contents' }}>
      {words.map(w => (
        <div key={w.id} className="pool-slot" style={{ height: '64px', width: '100%' }} onClick={() => onCardClick(w.id)}>
          <WordCard id={w.id} text={w.text} category={w.category} />
        </div>
      ))}
    </div>
  );
}

function getCategoryColor(cat) {
  if (cat === 'DOWNRIGHT') return 'var(--yellow-bg)';
  if (cat === 'PENNANT') return 'var(--green-bg)';
  if (cat === 'CIGARETTE BRANDS') return 'var(--blue-bg)';
  return 'var(--purple-bg)';
}

export default App;
