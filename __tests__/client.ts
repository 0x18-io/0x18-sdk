import { describe } from "@jest/globals";
import Client from "../src/client";

describe('client module', () => {
  test('Client basics', () => {
    const c = new Client({
      host: 'https://somelocalhost',
    });

    expect(c).toBeDefined();
    expect(c.ledgers).toBeDefined()
    expect(c.wallets).toBeDefined()
  })
})
