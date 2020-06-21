import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  forwardRef,
} from 'react';
import assert from 'tiny-invariant';

const contexts = {};

export const ListProvider = ({ keyBy, name, ...props }) => {
  assert(!!name, 'Lists from react-list-provider must have a unique name');

  const [items, setItems] = useState([]);

  const getItem = useCallback(
    (itemId) => items.find((item) => item[keyBy] === itemId),
    [setItems, items, keyBy]
  );

  const hasItem = useCallback((itemId) => !!getItem(itemId), [getItem]);

  const addItem = useCallback(
    (item) => {
      if (keyBy) {
        assert(
          !!item[keyBy] && !hasItem(item[keyBy]),
          `react-list-provider#addItem() must be provided an item with a unique '${keyBy}' when the 'keyBy' config is set. Check your list '${name}'.`
        );
      }
      setItems([...items, item]);
    },
    [items, setItems, hasItem]
  );

  const updateItem = useCallback(
    (itemId, newData) => {
      // bail if NO items exists with this ID
      if (!hasItem(itemId)) {
        return;
      }

      const oldIndex = items.findIndex((item) => item[keyBy] === itemId);
      const updatedItem = {
        ...items[oldIndex],
        ...newData,
        // Ensure they don't accidentally overwrite the id
        [keyBy]: items[oldIndex][keyBy],
      };

      setItems([
        ...items.slice(0, oldIndex),
        updatedItem,
        ...items.slice(oldIndex + 1),
      ]);
    },
    [hasItem, items, setItems]
  );

  const removeItems = useCallback(
    (itemIds) =>
      setItems(items.filter((item) => !itemIds.includes(item[keyBy]))),
    [setItems, items]
  );

  const removeItem = useCallback((itemId) => removeItems([itemId]), [
    removeItems,
  ]);

  const clearItems = useCallback(() => setItems([]), [setItems]);

  const immutableItems = useMemo(() => Object.freeze(items), [items]);

  contexts[name] = contexts[name] || createContext();
  const { Provider } = contexts[name];

  return (
    <Provider
      value={{
        items: immutableItems,
        addItem,
        clearItems,
        // These methods only make sense when items are keyed
        ...(keyBy && {
          updateItem,
          removeItem,
          removeItems,
          getItem,
          hasItem,
        }),
      }}
      {...props}
    />
  );
};

export const useList = ({ name }) => {
  assert(!!name, 'The react-list-provider#useList() method requires a `name`.');

  const context = useContext(contexts[name] || {});

  assert(
    !!context,
    'The useList() hook must be called from a descendent of the <ListProvider /> with a matching name.'
  );

  return context;
};

export const ListConsumer = ({ name, children, __isHOC }) => {
  assert(
    !!name,
    'The react-list-provider#<ListConsumer> component requires a `name`.'
  );

  const context = contexts[name];

  assert(
    !!context,
    `The react-list-provider#${
      __isHOC ? 'withListManager() HOC' : '<ListConsumer> component'
    } must be nested as a descendent of the <ListProvider> with a matching name.`
  );

  const { Consumer } = context;

  return <Consumer>{(ctx) => children(ctx)}</Consumer>;
};

export const withListManager = (Comp, { name } = {}) => {
  assert(
    !!name,
    'The react-list-provider#withListManager() HOC requires a `name` config passed as the second argument.'
  );

  return forwardRef((props, ref) => (
    <ListConsumer name={name} __isHOC>
      {(context) => <Comp listManager={context} {...props} ref={ref} />}
    </ListConsumer>
  ));
};
