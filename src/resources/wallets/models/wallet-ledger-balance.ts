class WalletLedgerBalance {
    protected data;
    constructor(balance: any) {
        this.data = balance;

        for (let key in this.data) {
            if (key === 'balance') {
                this.data.balance = BigInt(this.data.balance);
            }

            this.addAttributeGetterAndSetters(key, this.data[key]);
        }
    }

    protected addAttributeGetterAndSetters(key: string, value: any) {
        Object.defineProperty(this, key, {
            get: () => {
                return value;
            },
        });
    }
}

export default WalletLedgerBalance;
