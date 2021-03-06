"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var key in props) { var prop = props[key]; prop.configurable = true; if (prop.value) prop.writable = true; } Object.defineProperties(target, props); } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _stellarBase = require("stellar-base");

var xdr = _stellarBase.xdr;
var hash = _stellarBase.hash;
var Keypair = _stellarBase.Keypair;

var Operation = require("./operation").Operation;

var Transaction = require("./transaction").Transaction;

var Memo = require("./memo").Memo;

var FEE = 1000;
var MIN_LEDGER = 0;
var MAX_LEDGER = 4294967295; // max uint32

/**
* @class TransactionBuilder
*/

var TransactionBuilder = exports.TransactionBuilder = (function () {

    /**
    * <p>Transaction builder helps constructs a new Transaction using the given account
    * as the transaction's "source account". The transaction will use the current sequence
    * number of the given account as its sequence number and increment the given account's
    * sequence number by one. The given source account must include a private key for signing
    * the transaction or an error will be thrown.</p>
    *
    * <p>Operations can be added to the transaction via their corresponding builder methods, and
    * each returns the TransactionBuilder object so they can be chained together. After adding
    * the desired operations, call the build() method on the TransactionBuilder to return a fully
    * constructed Transaction that can be signed. The returned transaction will contain the
    * sequence number of the source account and include the signature from the source account.</p>
    *
    * <p>The following code example creates a new transaction with two payment operations
    * and a changeTrust operation. The Transaction's source account first funds destinationA,
    * then extends a trust line to destination A for a currency, then destinationA sends the
    * source account an amount of that currency. The built transaction would need to be signed by
    * both the source acccount and the destinationA account for it to be valid.</p>
    *
    * <pre>var transaction = new TransactionBuilder(source)
    *   .addOperation(Operation.payment({
            destination: destinationA,
            amount: "20000000",
            currency: Currency.native()
        }) // <- funds and creates destinationA
    *   .build();
    * </pre>
    * @constructor
    * @param {Account} sourceAccount - The source account for this transaction.
    * @param {object} [opts]
    * @param {number} [opts.fee] - The max fee willing to pay for this transaction.
    * @param {object} [opts.timebounds] - The timebounds for the validity of this transaction.
    * @param {string} [opts.timebounds.minTime] - 64 bit unix timestamp
    * @param {string} [opts.timebounds.maxTime] - 64 bit unix timestamp
    * @param {Memo} [opts.memo] - The memo for the transaction
    * @param {}
    */

    function TransactionBuilder(source) {
        var opts = arguments[1] === undefined ? {} : arguments[1];

        _classCallCheck(this, TransactionBuilder);

        if (!source) {
            throw new Error("must specify source account for the transaction");
        }
        this.source = source;
        this.operations = [];
        this.signers = [];

        this.fee = opts.fee || FEE;
        this.timebounds = opts.timebounds;

        this.memo = opts.memo || Memo.none();

        // the signed hex form of the transaction to be sent to Horizon
        this.blob = null;
    }

    _createClass(TransactionBuilder, {
        addOperation: {

            /**
            * Adds an operation to the transaction.
            * @param {xdr.Operation} The xdr operation object, use {@link Operation} static methods.
            */

            value: function addOperation(operation) {
                this.operations.push(operation);
                return this;
            }
        },
        addSigner: {

            /**
            * Adds the given signer's signature to the transaction.
            */

            value: function addSigner(keypair) {
                this.signers.push(keypair);
                return this;
            }
        },
        build: {

            /**
            * This will build the transaction and sign it with the source account. It will
            * also increment the source account's sequence number by 1.
            * @returns {Transaction} will return the built Transaction.
            */

            value: function build() {
                var attrs = {
                    sourceAccount: Keypair.fromAddress(this.source.address).publicKey(),
                    fee: this.fee,
                    seqNum: xdr.SequenceNumber.fromString(String(Number(this.source.sequence) + 1)),
                    memo: this.memo
                };
                if (this.timebounds) {
                    attrs.timeBounds = new xdr.TimeBounds(this.timebounds);
                }
                var tx = new xdr.Transaction(attrs);

                this.source.sequence = this.source.sequence + 1;

                tx.operations(this.operations);

                var tx_raw = tx.toXDR();

                var tx_hash = hash(tx_raw);
                var signatures = [];
                for (var i = 0; i < this.signers.length; i++) {
                    signatures.push(this.signers[i].signDecorated(tx_hash));
                }
                var envelope = new xdr.TransactionEnvelope({ tx: tx, signatures: signatures });

                return new Transaction(envelope);
            }
        }
    });

    return TransactionBuilder;
})();