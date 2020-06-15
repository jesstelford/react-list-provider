# React List Provider

Use Context to save lists of whatever you want, then access them anywhere in
your componpent tree.

`index.js`

```jsx
import { ListProvider } from 'react-list-provider';
import App from './app';
import ReactDOM from 'react-dom';

ReactDOM.render(
  <ListProvider name="notifications">
    <App />
  </ListProvider>,
  document.body
);
```

`app.js`

```jsx
const { useList } = require('react-list-provider');

export const App = () => {
  const { addItem, items } = useList({ name: 'notifications' });

  return (
    <div>
      {items.map((item) => (
        <div>Notification: {item.message}</div>
      ))}
      Example application
      <button
        onClick={() => addItem({ id: Date.now().toString(), message: 'Hi' })}
      >
        Say hi
      </button>
    </div>
  );
};
```

## Installation

```
yarn add react-list-provider
```
or, for `npm`:

```
npm install --save react-list-provider
```

## API

```javascript
import { ListProvider, ListConsumer, useList, withListManager } from 'react-list-provider';
```

### `<ListProvider>`

A React Context Provider for an instance of a list of items.

```jsx
<ListProvider name="notifications" keyBy="id">
  <App />
</ListProvider>
```

#### Props

| Prop    | isRequired | Description                                                                                                                                       |
|---------|------------|---------------------------------------------------------------------------------------------------------------------------------------------------|
| `name`  | ✅          | A unique name used to identify the list. Must match a corresponding usage of `useList`/`withListManager`/`ListConsumer`                           |
| `keyBy` |            | Enforce uniqueness by setting a key to use when adding items. For example, setting `'id'` will ensure all added items have a unique `'id'` field. If omitted, no uniqueness will be enforced, and only `items`/`addItems`/`clearItems` methods are exposed on the context. |

### List Methods

Each of `useList`/`withListManager`/`ListConsumer` return a context object which
contains the following keys:

|                | Type                        | Description                                                                                                                        |
|----------------|-----------------------------|------------------------------------------------------------------------------------------------------------------------------------|
| `items`        | `Array<Item>`                 | The list items as added with `addItem`                                                                                             |
| `addItem`      | `Function(<Item>): void`      | Add an individual item to the list. If the `<ListProvider>` has `keyBy` set, the item passed to `addItem` must contain that field. |
| `clearItems`   | `Function(): void`            | Remove all items from the list.                                                                                                    |
| `updateItem`*  | `Function(key, <Item>): void` | Update a single item in the list. Performs a shallow merge.                                                                        |
| `removeItem` * | `Function(key): void`         | Remove a single item from the list.                                                                                                |
| `hasItem` *    | `Function(key): Boolean`      | Check if an item in the list has the given key.                                                                                    |
| `getItem` *    | `Function(): <Item>`          | Retrieve the item in the list with the given key (or `undefined`).                                                                 |

\* _Only available when `keyBy` is set on the `<ListProvider>`_


### `<ListConsumer>`

A React Context Consumer, used to access the [list methods](#list-methods).

```jsx
<ListConsumer name="notifications">
  {context => {
    // context.items, context.addItem, ...etc
    return <App />;
  }}
</ListConsumer>
```

#### Props

| Prop   | isRequired | Description                                                                                   |
|--------|------------|-----------------------------------------------------------------------------------------------|
| `name` | ✅          | A unique name used to identify the list. Must match a corresponding usage of `<ListProvider>` |

### `useList(config)`

A React Hook, used to access the [list methods](#list-methods).

```jsx
const Component = () => {
  const { items, addItem, ...etc } = useList({ name: "notifications" });
  return <App />;
};
```

#### `config`

|        | isRequired | Description                                                                                   |
|--------|------------|-----------------------------------------------------------------------------------------------|
| `name` | ✅          | A unique name used to identify the list. Must match a corresponding usage of `<ListProvider>` |

### `withListManager(Component, config)`

Creates a React Higher Order Component which injects a prop named `listManager`;
an object containing the [list methods](#list-methods).

```jsx
const Component = ({ listManager }) => {
  // listManager.items, listManager.addItem, etc...
  return <App />
}

const ComponentWithList = withListManager(Component, { name: "notifications" });
```

#### `Component`

The existing React component to inject the prop `listManager` into.

#### `config`

|         | isRequired | Description                                                                                   |
|---------|------------|-----------------------------------------------------------------------------------------------|
| `name`  | ✅          | A unique name used to identify the list. Must match a corresponding usage of `<ListProvider>` |

## Nested Providers

It's possible to nest `<ListProvider>`s, enabling multiple lists to co-exists.

Nested Providers must be given a unique `name` to differentiate them:

```jsx
import { ListProvider, ListConsumer } from 'react-list-provider';
const App = () => (
  <ListProvider name="accounts">
    <ListProvider name="notifications">
      <ListConsumer name="notifications">
        {({ addItem }) => <button onClick={() => addItem('Hello')}>Add Notification</button>}
      </ListConsumer>
      <ListConsumer name="accounts">
        {({ addItem }) => <button onClick={() => addItem('Jess')}>Add Account</button>}
      </ListConsumer>
    </ListProvider>
  </ListProvider>
);
```
