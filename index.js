const isJsx = Symbol('JSX');

const nil = () => ({
  tag: 'null',
  [isJsx]: true,
});

const str = ({ string }) => ({
  tag: 'text',
  [isJsx]: true,
  content: string,
});

const fragment = ({ children }) => ({
  tag: 'fragment',
  [isJsx]: true,
  children,
});

const div = ({ children, ...attributes }) => ({
  tag: 'div',
  [isJsx]: true,
  attributes,
  children,
});

const button = ({ children, onClick }) => ({
  tag: 'button',
  [isJsx]: true,
  eventListeners: { click: onClick },
  children,
});

const hooksMap = (() => {
  const statesMap = new Map();
  return {
    get: (path) => {
      let current = statesMap;
      while (true) {
        if (current.has(path[0])) {
          current = current.get(path[0]);
        } else {
          const newEntry = path.length === 0 ? [] : new Map();
          current.set(path[0], newEntry);
          current = newEntry;
        }

        if (path.length === 0) {
          return current;
        }
        path = path.slice(1);
      }
    },
  };
})();

/**
 * React-klone
 */

let states = [];
let currentStateIndex = 0;

const useState = (initialState) => {
  const s = states;
  const i = currentStateIndex;

  // Gjør klar til neste useState-invokasjon
  currentStateIndex++;

  if (i >= s.length) {
    s.push(initialState);
  }

  return [
    s[i],
    (newState) => {
      s[i] = newState;
    },
  ];
};

const render = (comp, props = {}, path = []) => {
  states = hooksMap.get(path);
  currentStateIndex = 0;

  let reactTree = comp(props);

  if (reactTree[isJsx]) {
    return {
      ...reactTree,
      children: reactTree.children?.map((c, i) => render(c, {}, [...path, i])),
    };
  }

  let [component, properties, ...children] = reactTree;

  children = children.map((c) => {
    if (typeof c === 'string') {
      return () => [str, { string: c }];
    }
    if (c === null || c === undefined || c === false) {
      return () => [nil];
    }
    return () => c;
  });

  return render(component, { ...properties, children }, [...path, component]);
};

const mount = (domTree, domNode) => {
  switch (domTree.tag) {
    case 'null': {
      break;
    }
    case 'text': {
      domNode.appendChild(document.createTextNode(domTree.content));
      break;
    }
    case 'fragment': {
      domTree.children?.forEach((child) => mount(child, domNode));
      break;
    }
    default: {
      const newNode = document.createElement(domTree.tag);
      for (const attribute in domTree.attributes) {
        newNode.setAttribute(attribute, domTree.attributes[attribute]);
      }
      for (const event in domTree.eventListeners) {
        newNode.addEventListener(event, () => {
          domTree.eventListeners[event]();
          draw(App);
        });
      }
      domTree.children?.forEach((child) => {
        mount(child, newNode);
      });
      domNode.appendChild(newNode);
    }
  }
};

const draw = (Component) => {
  const screen = document.getElementById('app');
  screen.innerHTML = '';
  mount(render(Component, {}, [Component]), screen);
};

/**
 *  Applikkasjonskode
 */

const Kom = ({ input }) => {
  const [s, set] = useState('hei');
  return [
    div,
    {},
    s,
    input,
    [
      button,
      {
        onClick: () => {
          set(s + 'du');
        },
      },
      'dupliser!',
    ],
  ];
};

const App = () => {
  const [counter1, setCounter1] = useState(0);
  const [counter2, setCounter2] = useState(0);
  const [counter1isActive, setCounter1isActive] = useState(true);
  return [
    div,
    {},
    [div, { style: 'font-weight: bold; font-size: 16px' }, 'Min reactklone'],
    [
      div,
      { style: 'display: flex; justify-content: space-between; width: 150px' },

      [
        button,
        {
          onClick: () => {
            if (counter1isActive) {
              setCounter1(counter1 - 1);
            } else {
              setCounter2(counter2 - 1);
            }
          },
        },
        '-',
      ],

      [div, {}, `${counter1}`],
      [div, {}, `${counter2}`],

      [
        button,
        {
          onClick: () => {
            if (counter1isActive) {
              setCounter1(counter1 + 1);
            } else {
              setCounter2(counter2 + 1);
            }
          },
        },
        '+',
      ],
    ],

    [div, { style: 'margin-left: 53px' }, '^'],
    [div, { style: 'margin-left: 50px' }, '/'],
    [div, {}, '---------'],

    !counter1isActive && [
      button,
      { onClick: () => setCounter1isActive(true) },
      'bytt',
    ],

    counter1isActive && [
      button,
      { onClick: () => setCounter1isActive(false) },
      'bytt',
    ],
  ];
};

draw(App);
