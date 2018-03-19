An migration from python to js for tinychain.

The original version of python, please refer to :https://github.com/jamesob/tinychain

## Quick start

- [Install Docker & docker-compose](https://www.docker.com/community-edition#/download)
- Clone this repo: `git clone git@github.com:uwifi/tinychain.js.git`
- Run `docker-compose up`. This will spawn two tinychain.js nodes.
- Try running `TC_LOG_LABEL=client node client.js --balance some_address`;
    ```
    $ TC_LOG_LABEL=client node client.js --balance 14AsDS66ZW4zhZR4JVwStEZDzmXH2famYj

    2018-03-19T10:38:54.858Z [client] info: your address is 1Q2fBbg8XnnPiv1UHe44f2x9vf54YKXh7C
    2018-03-19T10:38:54.858Z [client] info: [Balance: 1N66SkzGuwmS1Md3kboBbnfup2nZmiKSSn] 50 ⛼
    ```
- Once you see a few blocks go by, try sending some money between the wallets
    ```
    $ TC_LOG_LABEL=client node client.js --send to_address --value 1337 from_address

    2018-03-19T10:38:54.858Z [client] info: your address is 1Q2fBbg8XnnPiv1UHe44f2x9vf54YKXh7C
    2018-03-19T10:38:54.858Z [client] info built txn Transaction(...)
    2018-03-19T10:38:54.858Z [client] info broadcasting txn 2aa89204456207384851a4bbf8bde155eca7fcf30b833495d5b0541f84931919
    ```
- Check on the status of the transaction
    ```
     $ TC_LOG_LABEL=client node client.js --txid e8f63eeeca32f9df28a3a62a366f63e8595cf70efb94710d43626ff4c0918a8a

     2018-03-19T10:38:54.858Z [client] info your address is 1898KEjkziq9uRCzaVUUoBwzhURt4nrbP8
     Mined in 0000000726752f82af3d0f271fd61337035256051a9a1e5881e82d93d8e42d66 at height 5
    ```
