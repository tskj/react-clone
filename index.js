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

const render = (comp, props = {}) => {
  let reactTree = comp(props);

  if (reactTree[isJsx]) {
    return {
      ...reactTree,
      children: reactTree.children?.map(render),
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

  return render(component, { ...props, children });
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
  mount(render(Component), screen);
};

const Kom = ({ input }) => {
  return [div, 'lol', input];
};

const App = () => {
  let state = 0;
  return [
    div,
    [(div, 'hei', 'du')],
    ['yup', [Kom, { input: 'undef' }]],
    [Kom, { input: 'test' }],
    `snålt`,
    [div, { style: 'color: red' }, 'der'],
    `${state}`,
    [
      button,
      {
        onClick: () => {
          state += 1;
        },
      },
      'trykk',
    ],
  ];
};

draw(App);
