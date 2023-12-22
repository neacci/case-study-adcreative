import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";

const useDebouncedValue = (input, time) => {
  const [debouncedValue, setDebouncedValue] = useState(input);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(input);
    }, time);

    return () => {
      clearTimeout(handler);
    };
  }, [input, time]);

  return debouncedValue;
};

const MultiSelect2 = () => {
  const [characters, setCharacters] = useState([]);
  const [nextPage, setNextPage] = useState(
    "https://rickandmortyapi.com/api/character/?page=1"
  );
  const [search, setSearch] = useState("");
  const [selectedCharacters, setSelectedCharacters] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const loaderRef = useRef(null);
  const debouncedSearch = useDebouncedValue(search, 500);

  const [error, setError] = useState(null);

  const loadCharacters = useCallback(async () => {
    if (!nextPage || isLoading) return;
    setError(null);
    setIsLoading(true);

    const url = new URL(nextPage);
    if (debouncedSearch) {
      url.searchParams.set("name", debouncedSearch);
    }

    try {
      const response = await axios.get(url.toString());
      setCharacters((prev) => [...prev, ...response.data.results]);
      setNextPage(response.data.info.next);
    } catch (error) {
      setError("Error fetching characters:");
      console.error("Error fetching characters:", error);
    } finally {
      setIsLoading(false);
    }
  }, [nextPage, isLoading, debouncedSearch]);

  const observer = useRef(
    new IntersectionObserver(
      (entries) => {
        const firstEntry = entries[0];
        if (firstEntry.isIntersecting) {
          loadCharacters();
        }
      },
      { threshold: 1.0 }
    )
  );

  const toggleCharacter = (character) => {
    setSelectedCharacters((prevSelected) => {
      const isCharacterSelected = prevSelected.some(
        (selected) => selected.id === character.id
      );
      return isCharacterSelected
        ? prevSelected.filter((selected) => selected.id !== character.id)
        : [...prevSelected, character];
    });
  };

  const highlightText = (text, highlight) => {
    const parts = text.split(new RegExp(`(${highlight})`, "gi"));
    return parts.map((part, i) =>
      part.toLowerCase() === highlight.toLowerCase() ? (
        <strong key={i}>{part}</strong>
      ) : (
        part
      )
    );
  };

  const removeCharacter = (id) => {
    setSelectedCharacters((prevSelected) =>
      prevSelected.filter((character) => character.id !== id)
    );
  };

  const isCharacterSelected = (character) => {
    return selectedCharacters.some((selected) => selected.id === character.id);
  };

  const handleKeyDown = (e, character, index) => {
    e.preventDefault();

    if (e.key === "ArrowDown" && index < characters.length - 1) {
      document.querySelectorAll(".character-item")[index + 1].focus();
    } else if (e.key === "ArrowUp" && index > 0) {
      document.querySelectorAll(".character-item")[index - 1].focus();
    } else if (e.key === "Enter") {
      toggleCharacter(character);
    }
  };

  const handleInputKeyDown = (e) => {
    if (
      e.key === "Backspace" &&
      search === "" &&
      selectedCharacters.length > 0
    ) {
      removeCharacter(selectedCharacters[selectedCharacters.length - 1].id);
    }
  };

  const CharacterItem = React.memo(
    ({ character, onSelect, isSelected, onKeyDown }) => {
      const itemStyle = {
        display: "flex",
        alignItems: "center",
        padding: "10px",
        borderBottom: "1px solid #ccc",
      };

      return (
        <div style={itemStyle} onKeyDown={onKeyDown} tabIndex={0}>
          <input
            type="checkbox"
            className="checkbox"
            checked={isSelected}
            onChange={() => onSelect(character)}
            style={{ marginRight: "10px" }}
          />
          <img
            src={character.image}
            alt={character.name}
            style={{
              width: "50px",
              height: "50px",
              marginRight: "10px",
              borderRadius: "50%",
            }}
          />
          <div style={{ flex: 1 }}>
            <div style={{ display: "block", marginBottom: "4px" }}>
              {highlightText(character.name, search)}
            </div>
            <p
              style={{ margin: 0 }}
            >{`${character.episode.length} Episodes`}</p>
          </div>
        </div>
      );
    }
  );

  useEffect(() => {
    const currentLoader = loaderRef.current;
    const currentObserver = observer.current;

    if (currentLoader) {
      currentObserver.observe(currentLoader);
    }

    return () => {
      if (currentLoader) {
        currentObserver.unobserve(currentLoader);
      }
    };
  }, []);

  useEffect(() => {
    setCharacters([]);
    setNextPage("https://rickandmortyapi.com/api/character/?page=1");
  }, [debouncedSearch]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const firstEntry = entries[0];
        if (firstEntry.isIntersecting) {
          loadCharacters();
        }
      },
      { threshold: 1.0 }
    );

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }

    return () => {
      if (loaderRef.current) {
        observer.disconnect();
      }
    };
  }, [loadCharacters]);

  return (
    <div
      style={{
        maxWidth: "300px",
        margin: "auto",
        paddingTop: "1rem",

        gap: ".5rem",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          padding: "5px",
          border: "1px solid #ccc",
          borderRadius: ".25rem",
          width: "100%",
        }}
      >
        {selectedCharacters.map((character) => (
          <div
            key={character.id}
            style={{ display: "flex", alignItems: "center", margin: "5px" }}
          >
            <span style={{ marginRight: "5px" }}>{character.name}</span>
            <button
              onClick={() => removeCharacter(character.id)}
              style={{ cursor: "pointer" }}
            >
              &#x2715;
            </button>
          </div>
        ))}
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={handleInputKeyDown}
          placeholder="Search characters"
          className="input input-bordered w-full max-w-xs"
          style={{
            flex: "1",
            padding: "5px",
            border: "none",
            outline: "none",
          }}
        />
      </div>
      <div
        style={{
          overflowY: "auto",
          maxHeight: "400px",
          border: "1px solid #ccc",
          borderRadius: "4px",
        }}
      >
        {characters.map((character, index) => (
          <CharacterItem
            key={uuidv4()}
            character={character}
            onSelect={() => toggleCharacter(character)}
            isSelected={isCharacterSelected(character)}
            onKeyDown={(e) => handleKeyDown(e, character, index)}
            className="character-item"
          />
        ))}

        {!isLoading && !error && (
          <div
            ref={loaderRef}
            style={{ height: "10px", visibility: "hidden" }}
          />
        )}
      </div>

      {isLoading && <span className="loading loading-ring loading-lg"></span>}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {error && (
          <>
            <div
              style={{
                color: "red",
                backgroundColor: "#ffdada",
                padding: "10px",
                margin: "10px 0",
                border: "1px solid #ff0000",
                borderRadius: "4px",
              }}
            >
              {error}
            </div>
            <button className="btn" onClick={loadCharacters}>
              Try Again
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default MultiSelect2;
