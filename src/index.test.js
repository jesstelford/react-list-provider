import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import cuid from 'cuid';
import { ListProvider, ListConsumer, useList, withListManager } from './';

const getUniqueName = () => cuid();

const Render = ({ children }) => children();

describe('ListProvider', () => {
  test('renders children', () => {
    const { container } = render(
      <ListProvider name={getUniqueName()}>
        <h1>Hello, world!</h1>
      </ListProvider>
    );
    expect(container.firstChild).toMatchInlineSnapshot(`
      <h1>
        Hello, world!
      </h1>
    `);
  });

  test('Throws when no name provided', () => {
    expect(() => {
      render(<ListProvider />);
    }).toThrow('must have a unique name');
  });
});

describe('useList', () => {
  test('throws when no name passed', () => {
    expect(() => {
      render(
        <Render>
          {() => {
            useList({});
            return null;
          }}
        </Render>
      );
    }).toThrow(
      'Invariant failed: The react-list-provider#useList() method requires a `name`.'
    );
  });

  test('throws when name passed does not match a provider', () => {
    expect(() => {
      render(
        <ListProvider name={getUniqueName()}>
          <Render>
            {() => {
              useList({ name: getUniqueName() });
              return null;
            }}
          </Render>
        </ListProvider>
      );
    }).toThrow(
      'Invariant failed: The useList() hook must be called from a descendent of the <ListProvider /> with a matching name.'
    );
  });
});

describe('ListConsumer', () => {
  test('throws when no name passed', () => {
    expect(() => {
      render(<ListConsumer />);
    }).toThrow(
      'Invariant failed: The react-list-provider#<ListConsumer> component requires a `name`.'
    );
  });

  test('throws when name passed does not match a provider', () => {
    expect(() => {
      render(
        <ListProvider name={getUniqueName()}>
          <ListConsumer name={getUniqueName()} />
        </ListProvider>
      );
    }).toThrow(
      'Invariant failed: The react-list-provider#<ListConsumer> component must be nested as a descendent of the <ListProvider> with a matching name.'
    );
  });
});

describe('withListManager', () => {
  test('throws when no name passed', () => {
    expect(() => {
      withListManager(<div />);
    }).toThrow(
      'The react-list-provider#withListManager() HOC requires a `name` config passed as the second argument.'
    );
  });

  test('throws when name passed does not match a provider', () => {
    const HOC = withListManager(<div />, { name: getUniqueName() });
    expect(() => {
      render(
        <ListProvider name={getUniqueName()}>
          <HOC />
        </ListProvider>
      );
    }).toThrow(
      'Invariant failed: The react-list-provider#withListManager() HOC must be nested as a descendent of the <ListProvider> with a matching name.'
    );
  });

  test('renders children', () => {
    const name = getUniqueName();
    const HOC = withListManager(() => <h1>Hello, world!</h1>, { name });
    const { container } = render(
      <ListProvider name={name}>
        <HOC />
      </ListProvider>
    );
    expect(container.firstChild).toMatchInlineSnapshot(`
      <h1>
        Hello, world!
      </h1>
    `);
  });
});

const useListRenderer = (keyField) => {
  const name = getUniqueName();
  let context = null;
  render(
    <ListProvider name={name} keyBy={keyField}>
      <Render>
        {() => {
          // eslint-disable-next-line react-hooks/rules-of-hooks
          context = useList({ name });
          return null;
        }}
      </Render>
    </ListProvider>
  );
  return { context };
};

const ListConsumerRenderer = (keyField) => {
  const name = getUniqueName();
  let context = null;
  render(
    <ListProvider name={name} keyBy={keyField}>
      <ListConsumer name={name}>
        {(ctx) => {
          context = ctx;
          return null;
        }}
      </ListConsumer>
    </ListProvider>
  );
  return { context };
};

const withListManagerRenderer = (keyField) => {
  const name = getUniqueName();
  let context = null;

  const HOC = withListManager(
    ({ listManager }) => {
      context = listManager;
      return null;
    },
    { name }
  );

  render(
    <ListProvider name={name} keyBy={keyField}>
      <HOC />
    </ListProvider>
  );

  return { context };
};

describe('context value', () => {
  // A few different ways of defining keys
  [undefined, 'id', 'key'].forEach((keyField) => {
    describe(`With ${keyField ? `keyBy="${keyField}` : 'no keyBy'}`, () => {
      // A few different ways of extracting the context values
      [useListRenderer, ListConsumerRenderer, withListManagerRenderer].forEach(
        (getContext) => {
          describe(getContext.name, () => {
            test('returns expected fields', () => {
              const { context } = getContext(keyField);

              expect(context).toEqual(
                expect.objectContaining({
                  addItem: expect.any(Function),
                  clearItems: expect.any(Function),
                  items: [],
                  ...(keyField && {
                    updateItem: expect.any(Function),
                    removeItem: expect.any(Function),
                    removeItems: expect.any(Function),
                    getItem: expect.any(Function),
                    hasItem: expect.any(Function),
                  }),
                })
              );
            });
          });
        }
      );
    });
  });
});

describe('addItem', () => {
  test('addItem does not require a key by default', () => {
    const name = getUniqueName();
    let context = null;
    render(
      <ListProvider name={name}>
        <ListConsumer name={name}>
          {(ctx) => {
            context = ctx;
            return null;
          }}
        </ListConsumer>
      </ListProvider>
    );
    expect(() => context.addItem({})).not.toThrow();
  });

  test('addItem throws if no key provided when keyBy is set', () => {
    const name = getUniqueName();
    const keyName = cuid.slug();
    let context = null;
    render(
      <ListProvider name={name} keyBy={keyName}>
        <ListConsumer name={name}>
          {(ctx) => {
            context = ctx;
            return null;
          }}
        </ListConsumer>
      </ListProvider>
    );
    expect(() => context.addItem({})).toThrow(
      `react-list-provider#addItem() must be provided an item with a unique '${keyName}' when the 'keyBy' config is set.`
    );
  });

  test('addItem works', () => {
    const name = getUniqueName();
    const itemToAdd = { this: 'that' };
    const { container } = render(
      <ListProvider name={name}>
        <ListConsumer name={name}>
          {(ctx) => {
            return (
              <div>
                <button id="add" onClick={() => ctx.addItem(itemToAdd)}>
                  Add item
                </button>
                <span>{JSON.stringify(ctx.items)}</span>
              </div>
            );
          }}
        </ListConsumer>
      </ListProvider>
    );
    expect(container.querySelector('span').textContent).toEqual('[]');
    fireEvent.click(container.querySelector('button#add'));
    expect(container.querySelector('span').textContent).toEqual(
      JSON.stringify([itemToAdd])
    );
    // We test this twice to ensure the Provider isn't accidentally supplying us
    // with old values
    fireEvent.click(container.querySelector('button'));
    expect(container.querySelector('span').textContent).toEqual(
      JSON.stringify([itemToAdd, itemToAdd])
    );
  });
});

test('clearItems works', () => {
  const name = getUniqueName();
  const itemToAdd = { this: 'that' };
  const { container } = render(
    <ListProvider name={name}>
      <ListConsumer name={name}>
        {(ctx) => {
          return (
            <div>
              <button id="add" onClick={() => ctx.addItem(itemToAdd)}>
                Add item
              </button>
              <button id="clear" onClick={() => ctx.clearItems()}>
                Clear
              </button>
              <span>{JSON.stringify(ctx.items)}</span>
            </div>
          );
        }}
      </ListConsumer>
    </ListProvider>
  );
  expect(container.querySelector('span').textContent).toEqual('[]');
  fireEvent.click(container.querySelector('button#add'));
  expect(container.querySelector('span').textContent).toEqual(
    JSON.stringify([itemToAdd])
  );
  fireEvent.click(container.querySelector('button#clear'));
  expect(container.querySelector('span').textContent).toEqual(
    JSON.stringify([])
  );
});

test('updateItem works', () => {
  const name = getUniqueName();
  const itemToAdd = { this: 'that', key: 123 };
  const updatedData = { this: 'those' };
  const { container } = render(
    <ListProvider name={name} keyBy="key">
      <ListConsumer name={name}>
        {(ctx) => {
          return (
            <div>
              <button id="add" onClick={() => ctx.addItem(itemToAdd)}>
                Add item
              </button>
              <button
                id="update"
                onClick={() => ctx.updateItem(itemToAdd.key, updatedData)}
              >
                Update
              </button>
              <span>{JSON.stringify(ctx.items)}</span>
            </div>
          );
        }}
      </ListConsumer>
    </ListProvider>
  );
  expect(container.querySelector('span').textContent).toEqual('[]');
  fireEvent.click(container.querySelector('button#add'));
  expect(container.querySelector('span').textContent).toEqual(
    JSON.stringify([itemToAdd])
  );
  fireEvent.click(container.querySelector('button#update'));
  expect(container.querySelector('span').textContent).toEqual(
    JSON.stringify([{ ...itemToAdd, ...updatedData }])
  );
});

test('removeItem works', () => {
  const name = getUniqueName();
  const firstItem = { this: 'that', key: 1 };
  const secondItem = { foo: 'bar', key: 2 };
  const { container } = render(
    <ListProvider name={name} keyBy="key">
      <ListConsumer name={name}>
        {(ctx) => {
          return (
            <div>
              <button id="add1" onClick={() => ctx.addItem(firstItem)}>
                Add item 1
              </button>
              <button id="add2" onClick={() => ctx.addItem(secondItem)}>
                Add item 2
              </button>
              <button id="remove" onClick={() => ctx.removeItem(firstItem.key)}>
                Remove
              </button>
              <span>{JSON.stringify(ctx.items)}</span>
            </div>
          );
        }}
      </ListConsumer>
    </ListProvider>
  );
  expect(container.querySelector('span').textContent).toEqual('[]');
  fireEvent.click(container.querySelector('button#add1'));
  fireEvent.click(container.querySelector('button#add2'));
  expect(container.querySelector('span').textContent).toEqual(
    JSON.stringify([firstItem, secondItem])
  );
  fireEvent.click(container.querySelector('button#remove'));
  expect(container.querySelector('span').textContent).toEqual(
    JSON.stringify([secondItem])
  );
});

test('removeItems works', () => {
  const name = getUniqueName();
  const firstItem = { this: 'that', key: 1 };
  const secondItem = { foo: 'bar', key: 2 };
  const thirdItem = { quux: 'zip', key: 3 };
  const { container } = render(
    <ListProvider name={name} keyBy="key">
      <ListConsumer name={name}>
        {(ctx) => {
          return (
            <div>
              <button id="add1" onClick={() => ctx.addItem(firstItem)}>
                Add item 1
              </button>
              <button id="add2" onClick={() => ctx.addItem(secondItem)}>
                Add item 2
              </button>
              <button id="add3" onClick={() => ctx.addItem(thirdItem)}>
                Add item 3
              </button>
              <button
                id="remove"
                onClick={() => ctx.removeItems([firstItem.key, thirdItem.key])}
              >
                Remove
              </button>
              <span>{JSON.stringify(ctx.items)}</span>
            </div>
          );
        }}
      </ListConsumer>
    </ListProvider>
  );
  expect(container.querySelector('span').textContent).toEqual('[]');
  fireEvent.click(container.querySelector('button#add1'));
  fireEvent.click(container.querySelector('button#add2'));
  fireEvent.click(container.querySelector('button#add3'));
  expect(container.querySelector('span').textContent).toEqual(
    JSON.stringify([firstItem, secondItem, thirdItem])
  );
  fireEvent.click(container.querySelector('button#remove'));
  expect(container.querySelector('span').textContent).toEqual(
    JSON.stringify([secondItem])
  );
});

test('getItem works', () => {
  const name = getUniqueName();
  const firstItem = { this: 'that', key: 1 };
  const secondItem = { foo: 'bar', key: 2 };
  const { container } = render(
    <ListProvider name={name} keyBy="key">
      <ListConsumer name={name}>
        {(ctx) => {
          return (
            <div>
              <button id="add1" onClick={() => ctx.addItem(firstItem)}>
                Add item 1
              </button>
              <button id="add2" onClick={() => ctx.addItem(secondItem)}>
                Add item 2
              </button>
              <span>{JSON.stringify(ctx.getItem(firstItem.key))}</span>
            </div>
          );
        }}
      </ListConsumer>
    </ListProvider>
  );
  expect(container.querySelector('span').textContent).toEqual('');
  fireEvent.click(container.querySelector('button#add1'));
  fireEvent.click(container.querySelector('button#add2'));
  expect(container.querySelector('span').textContent).toEqual(
    JSON.stringify(firstItem)
  );
});

test('Nested providers', () => {
  const name1 = getUniqueName();
  const name2 = getUniqueName();
  const item1 = { this: 'that' };
  const item2 = { foo: 'bar' };
  const { container } = render(
    <ListProvider name={name1}>
      <ListProvider name={name2}>
        <ListConsumer name={name1}>
          {(ctx1) => {
            return (
              <div>
                <button id="add1" onClick={() => ctx1.addItem(item1)}>
                  Add item
                </button>
                <span id="data1">{JSON.stringify(ctx1.items)}</span>
                <ListConsumer name={name2}>
                  {(ctx2) => {
                    return (
                      <div>
                        <button id="add2" onClick={() => ctx2.addItem(item2)}>
                          Add item
                        </button>
                        <span id="data2">{JSON.stringify(ctx2.items)}</span>
                      </div>
                    );
                  }}
                </ListConsumer>
              </div>
            );
          }}
        </ListConsumer>
      </ListProvider>
    </ListProvider>
  );
  expect(container.querySelector('#data1').textContent).toEqual('[]');
  expect(container.querySelector('#data2').textContent).toEqual('[]');
  fireEvent.click(container.querySelector('button#add1'));
  expect(container.querySelector('#data1').textContent).toEqual(
    JSON.stringify([item1])
  );
  expect(container.querySelector('#data2').textContent).toEqual('[]');
  fireEvent.click(container.querySelector('button#add2'));
  expect(container.querySelector('#data1').textContent).toEqual(
    JSON.stringify([item1])
  );
  expect(container.querySelector('#data2').textContent).toEqual(
    JSON.stringify([item2])
  );
});
