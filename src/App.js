import React from 'react';
import Button from 'react-bootstrap-button-loader';
import {Navbar, Image} from 'react-bootstrap';
import LendingPool from "./LendingPool.json";
import LendingPoolAddressProvider from "./LendingPoolAddressProvider.json";
import ERC20 from "./ERC20.json";
import Web3Modal from "web3modal";
import ProtocolDataProvider from './ProtocolDataProvider.json';
import DebtToken from './DebtToken.json';


const Web3 = require('web3');

const daiAddress = '0xFf795577d9AC8bD7D90Ee22b6C1703490b6512FD';
const lendingPoolAddressProviderAddress = '0x88757f2f99175387ab4c6a4b3067c77a695b0349';
const aDAIAddress = '0xdCf0aF9e59C002FA3AA091a46196b37530FD48a8';
const protocolDataProviderAddress = '0x3c73A5E5785cAC854D468F727c606C07488a29D6';

class App extends React.Component {
    state = {
        account: '',
        daiBalance: '',
        aDAIBalance: '',
        web3: '',
        tokenDepositAddress: '',
        tokenDepositAmount: '',
        aTokenRedeemAddress: '',
        aTokenRedeemAmount: '',
        loadingTokenDeposit: false,
        loadingaTokenRedeem: false,
        depositTokenMapping: {},
        redeemaTokenMapping: {},
        tokenMapping: {},
        delegatedDebtToken: '',
        delegateeAddress: '',
        delegatedAmount: '',
        delegatedInterestType: 'stable',
        loadingDelegateCredit: false,
        borrowToken: '',
        borrowAmount: '',
        borrowDelegatorAddress: '',
        borrowInterestType: '1',
        repayToken: '',
        repayAmount: '',
        repayDelegatorAddress: '',
        repayInterestType: '1',
        loadingBorrow: false,
        loadingRepay: false
    };

    async updateDAIBalance() {
        try {
            let contract = new this.state.web3.eth.Contract(ERC20, daiAddress);
            let balance = await contract.methods.balanceOf(this.state.account).call();
            balance = this.state.web3.utils.fromWei(balance);
            this.setState({daiBalance: balance.toString()});
        } catch (e) {

        }
    }

    async updateaDAIBalance() {
        try {
            let contract = new this.state.web3.eth.Contract(ERC20, aDAIAddress);
            let balance = await contract.methods.balanceOf(this.state.account).call();
            balance = this.state.web3.utils.fromWei(balance);
            this.setState({aDAIBalance: balance.toString()});
        } catch (e) {

        }
    }

    web3Modal = new Web3Modal({
        network: "kovan", // optional
        cacheProvider: true, // optional
        providerOptions: {}
    });

    async login() {
        const provider = await this.web3Modal.connect();
        await this.subscribeProvider(provider);
        const web3 = new Web3(provider);
        const accounts = await web3.eth.getAccounts();
        const address = accounts[0];
        const networkId = await web3.eth.net.getId();
        if (networkId !== 42) {
            alert('App works only for Kovan testnet');
            return;
        }
        this.setState({
            web3: web3,
            account: address
        });
        await this.updateDAIBalance();
        await this.updateaDAIBalance();
        const protocolDataProviderContract = new this.state.web3.eth.Contract(ProtocolDataProvider, protocolDataProviderAddress);
        const reserveTokens = await protocolDataProviderContract.methods.getAllReservesTokens().call();
        let depositTokenMapping = this.state.depositTokenMapping;
        reserveTokens.map((reserveToken) => depositTokenMapping[reserveToken[0]] = reserveToken[1]);
        const aTokens = await protocolDataProviderContract.methods.getAllATokens().call();
        let redeemaTokenMapping = this.state.redeemaTokenMapping;
        aTokens.map((aToken) => redeemaTokenMapping[aToken[0]] = aToken[1]);
        let tokenMapping = this.state.tokenMapping;
        reserveTokens.map((e, i) => tokenMapping[aTokens[i][1]] = e[1]);
        this.setState({
            depositTokenMapping: depositTokenMapping, redeemaTokenMapping: redeemaTokenMapping,
            tokenMapping: tokenMapping
        });
    }

    async logout() {
        this.resetApp();
    }

    async subscribeProvider(provider) {
        if (!provider.on) {
            return;
        }
        provider.on("close", () => this.resetApp());
        provider.on("accountsChanged", async (accounts) => {
            await this.setState({account: accounts[0]});
            await this.updateDAIBalance();
            await this.updateaDAIBalance();
        });
        provider.on("chainChanged", async (chainId) => {
            const {web3} = this.state;
            const networkId = await web3.eth.net.getId();
            if (networkId !== 42) {
                alert('App works only for Kovan testnet');
                return;
            }
            await this.updateDAIBalance();
            await this.updateaDAIBalance();
        });

        provider.on("networkChanged", async (networkId) => {
            if (networkId !== 42) {
                alert('App works only for Kovan testnet');
                return;
            }
            await this.updateDAIBalance();
            await this.updateaDAIBalance();
        });
    };

    async resetApp() {
        const {web3} = this.state;
        if (web3 && web3.currentProvider && web3.currentProvider.close) {
            await web3.currentProvider.close();
        }
        await this.web3Modal.clearCachedProvider();
        this.setState({account: '', web3: ''});
    };

    async componentWillMount() {
        if (this.web3Modal.cachedProvider) {
            this.login();
        }
    }

    strtodec(amount, dec) {
        var i = 0;
        if (amount.toString().indexOf('.') !== -1) {
            i = amount.toString().length - (amount.toString().indexOf('.') + 1);
        }
        let stringf = amount.toString().split('.').join('');
        if (dec < i) {
            console.warn("amount was truncated");
            stringf = stringf.substring(0, stringf.length - (i - dec));
        } else {
            stringf = stringf + "0".repeat(dec - i);
        }
        return stringf;
    }

    render() {
        if (this.state.account === '') {
            return (
                <div>
                    <Navbar bg="primary" variant="dark">
                        <div style={{width: "90%"}}>
                            <Navbar.Brand href="/">
                                <b>Aave Credit Delegation</b>
                            </Navbar.Brand>
                        </div>
                        <Button variant="default btn-sm" onClick={this.login.bind(this)} style={{float: "right"}}>
                            Connect
                        </Button>
                    </Navbar>
                    <div className="panel-landing  h-100 d-flex" id="section-1">
                        <div className="container row" style={{marginTop: "50px"}}>
                            <div className="col l8 m12">

                                <p className="h2">
                                    Aave Credit Delegation
                                </p>
                                <p className="h6" style={{marginTop: "10px"}}>
                                    Aave Credit Delegation allows a depositor to deposit funds in the protocol to earn
                                    interest, and delegate borrowing power to other users.
                                </p>
                                <Image src="/aave_credit_delegation.png"
                                       style={{height: "350px", width: "800px", marginTop: "10px"}} fluid/>
                            </div>
                        </div>
                    </div>
                </div>
            )
        }
        return (
            <div className="App">
                <div>
                    <Navbar bg="primary" variant="dark" style={{position: "sticky"}} fixed="top">
                        <div style={{width: "90%"}}>
                            <Navbar.Brand href="/">
                                <b>Aave Credit Delegation</b>
                            </Navbar.Brand>
                        </div>
                        <Button variant="default btn-sm" onClick={this.logout.bind(this)} style={{float: "right"}}>
                            Logout
                        </Button>
                    </Navbar>
                    <div style={{margin: "20px"}}>
                        <div>
                            <div style={{wordWrap: "break-word"}}><b>Account:</b> {this.state.account}</div>
                            <div><b>DAI Balance:</b> {this.state.daiBalance}</div>
                            <div><b>aDAI Balance:</b> {this.state.aDAIBalance}</div>
                            <br/>
                            <h5>Deposit Tokens</h5>
                            <div>
                                <select className="form-control" style={{marginBottom: "10px"}}
                                        value={this.state.tokenDepositAddress}
                                        onChange={e => this.updateTokenDepositAddress(e.target.value)}>
                                    <option value="" disabled selected>Select Token</option>
                                    {
                                        Object.keys(this.state.depositTokenMapping).map((key, index) => (
                                            <option value={this.state.depositTokenMapping[key]}
                                                    key={"deposit-tokens-" + index}>{key}</option>
                                        ))
                                    }
                                </select>
                            </div>
                            <div style={{marginBottom: "10px"}}>
                                <input className="form-control" type="text" placeholder="Amount"
                                       value={this.state.tokenDepositAmount}
                                       onChange={e => this.updateTokenDepositAmount(e.target.value)}/>
                            </div>
                            <div>
                                <Button variant="primary btn" onClick={this.depositToken.bind(this)}
                                        loading={this.state.loadingTokenDeposit}
                                >Deposit Tokens</Button>
                            </div>
                            <br/>


                            <h5>Redeem aTokens</h5>
                            <div>
                                <select className="form-control" style={{marginBottom: "10px"}}
                                        value={this.state.aTokenRedeemAddress}
                                        onChange={e => this.updateaTokenRedeemAddress(e.target.value)}>
                                    <option value="" disabled selected>Select aToken</option>
                                    {
                                        Object.keys(this.state.redeemaTokenMapping).map((key, index) => (
                                            <option value={this.state.redeemaTokenMapping[key]}
                                                    key={"redeem-tokens-" + index}>{key}</option>
                                        ))
                                    }
                                </select>
                            </div>
                            <div>
                                <input className="form-control" type="text" placeholder="Amount"
                                       value={this.state.aTokenRedeemAmount}
                                       onChange={e => this.updateaTokenRedeemAmount(e.target.value)}/>
                            </div>
                            <div>
                                <Button variant="primary btn" onClick={this.redeemaToken.bind(this)}
                                        style={{marginTop: "10px"}}
                                        loading={this.state.loadingaTokenRedeem}
                                >Redeem aTokens</Button>
                            </div>
                            <br/>


                            <h5>Delegate Credit</h5>
                            <div>
                                <select className="form-control" style={{marginBottom: "10px"}}
                                        value={this.state.delegatedDebtToken}
                                        onChange={e => this.updateDelegatedDebtToken(e.target.value)}>
                                    <option value="" disabled selected>Select Token</option>
                                    {
                                        Object.keys(this.state.depositTokenMapping).map((key, index) => (
                                            <option value={this.state.depositTokenMapping[key]}
                                                    key={"delegate-tokens-" + index}>{key}</option>
                                        ))
                                    }
                                </select>
                            </div>
                            <div style={{marginBottom: "10px"}}>
                                <input className="form-control" type="text" placeholder="Amount"
                                       value={this.state.delegatedAmount}
                                       onChange={e => this.updateDelegatedAmount(e.target.value)}/>
                            </div>
                            <div>
                                <select className="form-control" style={{marginBottom: "10px"}}
                                        value={this.state.delegatedInterestType}
                                        onChange={e => this.updateDelegatedInterestType(e.target.value)}>
                                    <option value="stable">stable</option>
                                    <option value="variable">variable</option>
                                </select>
                            </div>
                            <div style={{marginBottom: "10px"}}>
                                <input className="form-control" type="text" placeholder="Delegatee Address"
                                       value={this.state.delegateeAddress}
                                       onChange={e => this.updateDelegateeAddress(e.target.value)}/>
                            </div>
                            <div>
                                <Button variant="primary btn" onClick={this.delegateCredit.bind(this)}
                                        loading={this.state.loadingDelegateCredit}
                                >Delegate Credit</Button>
                            </div>
                            <br/>

                            <h5>Borrow Credit</h5>
                            <div>
                                <select className="form-control" style={{marginBottom: "10px"}}
                                        value={this.state.borrowToken}
                                        onChange={e => this.updateBorrowToken(e.target.value)}>
                                    <option value="" disabled selected>Select Token</option>
                                    {
                                        Object.keys(this.state.depositTokenMapping).map((key, index) => (
                                            <option value={this.state.depositTokenMapping[key]}
                                                    key={"borrow-tokens-" + index}>{key}</option>
                                        ))
                                    }
                                </select>
                            </div>
                            <div style={{marginBottom: "10px"}}>
                                <input className="form-control" type="text" placeholder="Amount"
                                       value={this.state.borrowAmount}
                                       onChange={e => this.updateBorrowAmount(e.target.value)}/>
                            </div>
                            <div>
                                <select className="form-control" style={{marginBottom: "10px"}}
                                        value={this.state.borrowInterestType}
                                        onChange={e => this.updateBorrowInterestType(e.target.value)}>
                                    <option value="1">stable</option>
                                    <option value="2">variable</option>
                                </select>
                            </div>
                            <div style={{marginBottom: "10px"}}>
                                <input className="form-control" type="text" placeholder="Delegator Address"
                                       value={this.state.borrowDelegatorAddress}
                                       onChange={e => this.updateBorrowDelegatorAddress(e.target.value)}/>
                            </div>
                            <div>
                                <Button variant="primary btn" onClick={this.borrowCredit.bind(this)}
                                        loading={this.state.loadingBorrow}
                                >Borrow Credit</Button>
                            </div>
                            <br/>


                            <h5>Repay Credit</h5>
                            <div>
                                <select className="form-control" style={{marginBottom: "10px"}}
                                        value={this.state.repayToken}
                                        onChange={e => this.updateRepayToken(e.target.value)}>
                                    <option value="" disabled selected>Select Token</option>
                                    {
                                        Object.keys(this.state.depositTokenMapping).map((key, index) => (
                                            <option value={this.state.depositTokenMapping[key]}
                                                    key={"repay-tokens-" + index}>{key}</option>
                                        ))
                                    }
                                </select>
                            </div>
                            <div style={{marginBottom: "10px"}}>
                                <input className="form-control" type="text" placeholder="Amount"
                                       value={this.state.repayAmount}
                                       onChange={e => this.updateRepayAmount(e.target.value)}/>
                            </div>
                            <div>
                                <select className="form-control" style={{marginBottom: "10px"}}
                                        value={this.state.repayInterestType}
                                        onChange={e => this.updateRepayInterestType(e.target.value)}>
                                    <option value="1">stable</option>
                                    <option value="2">variable</option>
                                </select>
                            </div>
                            <div style={{marginBottom: "10px"}}>
                                <input className="form-control" type="text" placeholder="Delegator Address"
                                       value={this.state.repayDelegatorAddress}
                                       onChange={e => this.updateRepayDelegatorAddress(e.target.value)}/>
                            </div>
                            <div>
                                <Button variant="primary btn" onClick={this.repayCredit.bind(this)}
                                        loading={this.state.loadingRepay}
                                >Repay Credit</Button>
                            </div>
                            <br/>

                        </div>
                        <br/>
                    </div>
                </div>
            </div>
        )
    }

    updateTokenDepositAddress(value) {
        this.setState({tokenDepositAddress: value})
    }

    updateTokenDepositAmount(value) {
        if (value === '') {
            this.setState({tokenDepositAmount: value});
            return
        }
        let valid = value.match(/^[+]?(?=.?\d)\d*(\.\d{0,18})?$/);
        if (!valid) {
            return
        }
        this.setState({tokenDepositAmount: value})
    }

    updateaTokenRedeemAddress(value) {
        this.setState({aTokenRedeemAddress: value})
    }

    updateaTokenRedeemAmount(value) {
        if (value === '') {
            this.setState({aTokenRedeemAmount: value});
            return
        }
        let valid = value.match(/^[+]?(?=.?\d)\d*(\.\d{0,18})?$/);
        if (!valid) {
            return
        }
        this.setState({aTokenRedeemAmount: value})
    }

    updateDelegatedInterestType(value) {
        this.setState({delegatedInterestType: value});
    }

    updateDelegatedAmount(value) {
        if (value === '') {
            this.setState({delegatedAmount: value});
            return
        }
        let valid = value.match(/^[+]?(?=.?\d)\d*(\.\d{0,18})?$/);
        if (!valid) {
            return
        }
        this.setState({delegatedAmount: value})
    }

    updateDelegateeAddress(value) {
        this.setState({delegateeAddress: value})
    }

    updateDelegatedDebtToken(value) {
        this.setState({delegatedDebtToken: value})
    }

    updateBorrowToken(value) {
        this.setState({borrowToken: value});
    }

    updateBorrowAmount(value) {
        if (value === '') {
            this.setState({borrowAmount: value});
            return
        }
        let valid = value.match(/^[+]?(?=.?\d)\d*(\.\d{0,18})?$/);
        if (!valid) {
            return
        }
        this.setState({borrowAmount: value})
    }

    updateBorrowDelegatorAddress(value) {
        this.setState({borrowDelegatorAddress: value});
    }

    updateBorrowInterestType(value) {
        this.setState({borrowInterestType: value});
    }

    updateRepayToken(value) {
        this.setState({repayToken: value});
    }

    updateRepayAmount(value) {
        if (value === '') {
            this.setState({repayAmount: value});
            return
        }
        let valid = value.match(/^[+]?(?=.?\d)\d*(\.\d{0,18})?$/);
        if (!valid) {
            return
        }
        this.setState({repayAmount: value})
    }

    updateRepayDelegatorAddress(value) {
        this.setState({repayDelegatorAddress: value});
    }

    updateRepayInterestType(value) {
        this.setState({repayInterestType: value});
    }

    async depositToken() {
        if (this.state.tokenDepositAmount === '' || this.state.tokenDepositAddress === '') {
            alert('All details are required');
            return;
        }
        let tokenAddress = this.state.tokenDepositAddress;
        this.setState({loadingTokenDeposit: true});
        try {
            const ERC20Contract = new this.state.web3.eth.Contract(ERC20, tokenAddress);
            let decimals = await ERC20Contract.methods.decimals().call();
            let amount = this.strtodec(this.state.tokenDepositAmount, decimals);
            const referralCode = '0';
            const lendingPoolAddressProviderContract = new this.state.web3.eth.Contract(LendingPoolAddressProvider,
                lendingPoolAddressProviderAddress);
            const lendingPoolAddress = await lendingPoolAddressProviderContract.methods.getLendingPool().call();
            await ERC20Contract.methods.approve(lendingPoolAddress, amount).send({from: this.state.account});
            const lendingPoolContract = new this.state.web3.eth.Contract(LendingPool, lendingPoolAddress);
            await lendingPoolContract.methods.deposit(tokenAddress, amount, this.state.account, referralCode)
                .send({from: this.state.account});

        } catch (e) {
            console.log(e);
            alert('Deposit Token failed');
        }
        await this.updateDAIBalance();
        await this.updateaDAIBalance();
        this.setState({loadingTokenDeposit: false});
    }

    async redeemaToken() {
        if (this.state.aTokenRedeemAmount === '' || this.state.aTokenRedeemAddress === '') {
            alert('All details are required');
            return;
        }
        let tokenAddress = this.state.aTokenRedeemAddress;
        this.setState({loadingaTokenRedeem: true});
        try {
            const contract = new this.state.web3.eth.Contract(ERC20, tokenAddress);
            const decimals = await contract.methods.decimals().call();
            let amount = this.strtodec(this.state.aTokenRedeemAmount, decimals);
            const lendingPoolAddressProviderContract = new this.state.web3.eth.Contract(LendingPoolAddressProvider,
                lendingPoolAddressProviderAddress);
            const lendingPoolAddress = await lendingPoolAddressProviderContract.methods.getLendingPool().call();
            await contract.methods.approve(lendingPoolAddress, amount).send({from: this.state.account});
            const lendingPoolContract = new this.state.web3.eth.Contract(LendingPool, lendingPoolAddress);
            await lendingPoolContract.methods.withdraw(this.state.tokenMapping[tokenAddress], amount, this.state.account).send({from: this.state.account});
        } catch (e) {
            console.log(e);
            alert('Redeem aTokens failed');
        }
        await this.updateDAIBalance();
        await this.updateaDAIBalance();
        this.setState({loadingaTokenRedeem: false});
    }

    async delegateCredit() {
        if (this.state.delegateeAddress === '' || this.state.delegatedInterestType === ''
            || this.state.delegatedAmount === '' || this.state.delegatedDebtToken === '') {
            alert('All details are required');
            return;
        }
        this.setState({loadingDelegateCredit: true});
        try {
            const protocolDataProviderContract = new this.state.web3.eth.Contract(ProtocolDataProvider, protocolDataProviderAddress);
            const tokenDetails = await protocolDataProviderContract.methods.getReserveTokensAddresses(this.state.delegatedDebtToken).call();
            const borrower = this.state.delegateeAddress;
            const contract = new this.state.web3.eth.Contract(ERC20, this.state.delegatedDebtToken);
            const decimals = await contract.methods.decimals().call();
            let amount = this.strtodec(this.state.delegatedAmount, decimals);
            let debtTokenAddress;
            if (this.state.delegatedInterestType === "stable") {
                debtTokenAddress = tokenDetails.stableDebtTokenAddress;
            } else {
                debtTokenAddress = tokenDetails.variableDebtTokenAddress;
            }
            const debtContract = new this.state.web3.eth.Contract(DebtToken, debtTokenAddress);
            await debtContract.methods.approveDelegation(borrower, amount).send({from: this.state.account});
        } catch (e) {
            console.log(e);
            alert('Credit Delegation failed');
        }
        this.setState({loadingDelegateCredit: false});
    }

    async borrowCredit() {
        if (this.state.borrowToken === '' || this.state.borrowAmount === '' || this.state.borrowDelegatorAddress
            === '' || this.state.borrowInterestType === '') {
            alert('All details are required');
            return;
        }
        let tokenAddress = this.state.borrowToken;
        this.setState({loadingBorrow: true});
        try {
            const ERC20Contract = new this.state.web3.eth.Contract(ERC20, tokenAddress);
            let decimals = await ERC20Contract.methods.decimals().call();
            let amount = this.strtodec(this.state.borrowAmount, decimals);
            const referralCode = '0';
            const lendingPoolAddressProviderContract = new this.state.web3.eth.Contract(LendingPoolAddressProvider,
                lendingPoolAddressProviderAddress);
            const lendingPoolAddress = await lendingPoolAddressProviderContract.methods.getLendingPool().call();
            const lendingPoolContract = new this.state.web3.eth.Contract(LendingPool, lendingPoolAddress);
            await lendingPoolContract.methods.borrow(tokenAddress, amount, this.state.borrowInterestType,
                referralCode, this.state.borrowDelegatorAddress)
                .send({from: this.state.account});

        } catch (e) {
            console.log(e);
            alert('Borrow Token failed');
        }
        this.setState({loadingBorrow: false});
    }

    async repayCredit() {
        if (this.state.repayToken === '' || this.state.repayAmount === '' || this.state.repayDelegatorAddress === ''
            || this.state.repayInterestType === '') {
            alert('All details are required');
            return
        }
        let tokenAddress = this.state.repayToken;
        this.setState({loadingRepay: true});
        try {
            const ERC20Contract = new this.state.web3.eth.Contract(ERC20, tokenAddress);
            let decimals = await ERC20Contract.methods.decimals().call();
            let amount = this.strtodec(this.state.repayAmount, decimals);
            const lendingPoolAddressProviderContract = new this.state.web3.eth.Contract(LendingPoolAddressProvider,
                lendingPoolAddressProviderAddress);
            const lendingPoolAddress = await lendingPoolAddressProviderContract.methods.getLendingPool().call();
            await ERC20Contract.methods.approve(lendingPoolAddress, amount).send({from: this.state.account});
            const lendingPoolContract = new this.state.web3.eth.Contract(LendingPool, lendingPoolAddress);
            await lendingPoolContract.methods.repay(tokenAddress, amount, this.state.repayInterestType,
                this.state.repayDelegatorAddress).send({from: this.state.account});

        } catch (e) {
            console.log(e);
            alert('Repay Token failed');
        }
        this.setState({loadingRepay: false});
    }

}

export default App
