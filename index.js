const isJsx = Symbol('JSX');

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

const isProps = (props) =>
  typeof props === 'object' &&
  !Array.isArray(props) &&
  props !== null &&
  props[isJsx] !== true;

const hooksMap = (() => {
  let statesMap = new Map();
  return {
    get: (path) => {
      let currentMap = statesMap;
      while (true) {
        if (currentMap.has(path[0])) {
          currentMap = currentMap.get(path[0]);

          if (path.length === 0) {
            return currentMap;
          }

          path = path.slice(1);
        } else {
          const newMap = path.length === 0 ? [] : new Map();
          currentMap.set(path[0], newMap);

          if (path.length === 0) {
            return newMap;
          }

          currentMap = newMap;
          path = path.slice(1);
        }
      }
    },
  };
})();

let states = [];
let currentStateIndex = 0;

const useState = (initialState) => {
  const s = states;
  const i = currentStateIndex;

  // Gjør klar til neste useState:
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

  if (typeof reactTree[0] !== 'function') {
    reactTree = [fragment, ...reactTree];
  }

  const [component, ...propsAndChildren] = reactTree;

  let children;
  if (isProps(propsAndChildren[0])) {
    props = propsAndChildren[0];
    children = propsAndChildren.slice(1);
  } else {
    props = {};
    children = propsAndChildren;
  }

  children = children.map((c) => {
    if (typeof c === 'string') {
      return () => [str, { string: c }];
    }
    return () => c;
  });

  return render(component, { ...props, children }, [...path, component]);
};

const mount = (domTree, domNode) => {
  switch (domTree.tag) {
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
    s,
    input,
    [
      button,
      {
        onClick: () => {
          set(s + 'du');
        },
      },
      'dupliser',
    ],
  ];
};

const App = () => {
  let [state, setState] = useState(0);
  let [state2, setState2] = useState(0);
  return [
    div,
    [div, 'hei', 'du'],
    ['yup', [Kom, { input: 'undef' }]],
    [Kom, { input: 'test' }],
    `snålt`,
    [div, { style: 'color: red' }, 'der'],
    [div, `${state}`],
    [
      button,
      {
        onClick: () => {
          setState(state + 1);
        },
      },
      'trykk',
    ],
    [div, `${state2}`],
    [
      button,
      {
        onClick: () => {
          setState2(state2 + 1);
        },
      },
      'trykk!',
    ],
  ];
};

draw(App);
