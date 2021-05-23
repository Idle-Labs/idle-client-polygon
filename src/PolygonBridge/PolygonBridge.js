import React, { Component } from 'react';
import FlexLoader from '../FlexLoader/FlexLoader';
import { Flex, Box, Text, Icon } from "rimble-ui";
import FunctionsUtil from '../utilities/FunctionsUtil';
// import TokenWrapper from '../TokenWrapper/TokenWrapper';
import AssetSelector from '../AssetSelector/AssetSelector';
import DashboardCard from '../DashboardCard/DashboardCard';
import CardIconButton from '../CardIconButton/CardIconButton';
import SendTxWithBalance from '../SendTxWithBalance/SendTxWithBalance';

class PolygonBridge extends Component {

  state = {
    stats:[],
    steps:null,
    infoBox:null,
    globalStats:[],
    inputValue:null,
    description:null,
    tokenConfig:null,
    balanceProp:null,
    tokenBalance:null,
    contractInfo:null,
    stakedBalance:null,
    selectedToken:null,
    rewardMultiplier:1,
    accountingData:null,
    selectedAction:null,
    selectedOption:null,
    successMessage:null,
    permitEnabled:false,
    poolTokenPrice:null,
    availableTokens:null,
    availableNetworks:[],
    approveEnabled:false,
    rewardTokenPrice:null,
    contractApproved:false,
    tokenWrapperProps:null,
    distributionSpeed:null,
    approveDescription:null,
    balanceSelectorInfo:null,
    transactionSucceeded:false
  };

  // Utils
  functionsUtil = null;

  loadUtils(){
    if (this.functionsUtil){
      this.functionsUtil.setProps(this.props);
    } else {
      this.functionsUtil = new FunctionsUtil(this.props);
    }
  }

  componentWillMount(){
    this.loadUtils();
  }

  componentDidMount(){
    this.loadData();
  }

  async componentDidUpdate(prevProps,prevState){
    this.loadUtils();

    const selectedTokenChanged = prevState.selectedToken !== this.state.selectedToken;
    if (selectedTokenChanged){
      const tokenConfig = this.props.toolProps.availableTokens[this.state.selectedToken];
      const rootTokenConfig = tokenConfig.rootToken;
      const childTokenConfig = tokenConfig.childToken;

      // Init contracts
      await Promise.all([
        this.props.initContract(rootTokenConfig.name,rootTokenConfig.address,rootTokenConfig.abi),
        this.props.initContractCustomProvider(childTokenConfig.name,childTokenConfig.address,childTokenConfig.abi,this.props.web3Polygon)
      ]);

      this.setState({
        tokenConfig
      },() => {
        this.updateData();
      });
    } else {
      const selectedActionChanged = prevState.selectedAction !== this.state.selectedAction;
      const contractApprovedChanged = prevState.contractApproved !== this.state.contractApproved;
      if (selectedActionChanged || contractApprovedChanged){
        this.updateData(selectedActionChanged);
      }
    }

    const contractInfoChanged = JSON.stringify(prevState.contractInfo) !== JSON.stringify(this.state.contractInfo);
    if (contractInfoChanged){
      this.changeInputCallback();
    }
  }

  async changeInputCallback(inputValue=null){

  }

  getTransactionParams(amount){
    let methodName = null;
    let methodParams = [];
    let contractName = null;
    amount = this.functionsUtil.toBN(amount);
    switch (this.state.selectedAction){
      case 'Deposit':
        methodName = 'depositFor';
        contractName = 'RootChainManager';
        const depositData = this.props.web3.eth.abi.encodeParameter('uint256', amount);
        methodParams = [this.props.account,this.state.tokenConfig.rootToken.address,depositData];
      break;
      case 'Withdraw':
        methodName = 'withdraw';
        methodParams = [amount];
        contractName = this.state.tokenConfig.childToken.name;
      break;
      default:
      break;
    }
    return {
      methodName,
      methodParams,
      contractName
    };
  }

  async contractApproved(contractApproved){
    this.setState({
      contractApproved
    });
  }

  async transactionSucceeded(tx,amount,params){
    let infoBox = null;
    console.log('transactionSucceeded',tx);
    switch (this.state.selectedAction){
      case 'Deposit':
        const depositedTokensLog = tx.txReceipt && tx.txReceipt.logs ? tx.txReceipt.logs.find( log => log.address.toLowerCase() === this.state.tokenConfig.address.toLowerCase() && log.topics.find( t => t.toLowerCase().includes(this.state.contractInfo.address.replace('0x','').toLowerCase()) ) && log.topics.find( t => t.toLowerCase().includes(this.props.account.replace('0x','').toLowerCase()) ) && log.data.toLowerCase()!=='0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'.toLowerCase() ) : null;
        const depositedTokens = depositedTokensLog ? this.functionsUtil.fixTokenDecimals(parseInt(depositedTokensLog.data,16),this.state.tokenConfig.decimals) : this.functionsUtil.BNify(0);
        debugger;
        infoBox = {
          icon:'DoneAll',
          iconProps:{
            color:this.props.theme.colors.transactions.status.completed
          },
          text:`You have successfully deposited <strong>${depositedTokens.toFixed(4)} ${this.state.selectedToken}</strong> in the Polygon chain. Please wait up to 10 minutes for your balance to be reflected in the Polygon chain.`
        }
      break;
      case 'Withdraw':
        const withdrawnTokensLog = tx.txReceipt && tx.txReceipt.logs ? tx.txReceipt.logs.find( log => log.address.toLowerCase() === this.state.tokenConfig.address.toLowerCase() && log.topics.find( t => t.toLowerCase().includes(this.state.contractInfo.address.replace('0x','').toLowerCase()) ) && log.topics.find( t => t.toLowerCase().includes(this.props.account.replace('0x','').toLowerCase()) ) && log.data.toLowerCase()!=='0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'.toLowerCase() ) : null;
        const withdrawnTokens = withdrawnTokensLog ? this.functionsUtil.fixTokenDecimals(parseInt(withdrawnTokensLog.data,16),this.state.tokenConfig.decimals) : this.functionsUtil.BNify(0);
        debugger;
        infoBox = {
          icon:'DoneAll',
          iconProps:{
            color:this.props.theme.colors.transactions.status.completed
          },
          text:`You have successfully withdrawn <strong>${withdrawnTokens.toFixed(4)} ${this.state.selectedToken}</strong> from the Polygon chain. Please wait up to 2-3 hours to be able to complete the withdrawal.`
        }
      break;
      default:
      break;
    }

    const transactionSucceeded = true;

    this.setState({
      infoBox,
      transactionSucceeded
    },() => {
      this.updateData();
    });
  }

  async updateData(selectedActionChanged=false){
    const newState = {};
    switch (this.state.selectedAction){
      case 'Deposit':
        newState.permitEnabled = false;
        newState.approveEnabled = true;
        newState.availableNetworks = [1,5];
        newState.contractInfo = this.props.toolProps.contracts.ERC20Predicate;
        newState.approveDescription = `Approve the contract to deposit your ${this.state.selectedToken}`;
        newState.balanceProp = await this.functionsUtil.getTokenBalance(this.state.tokenConfig.rootToken.name,this.props.account);
      break;
      case 'Withdraw':
        newState.permitEnabled = false;
        newState.approveEnabled = false;
        newState.approveDescription = '';
        newState.availableNetworks = [137,80001];
        newState.contractInfo = this.state.tokenConfig.childToken;
        newState.balanceProp = await this.functionsUtil.getTokenBalance(this.state.tokenConfig.childToken.name,this.props.account);
      break;
      default:
      break;
    }

    if (selectedActionChanged){
      newState.infoBox = null;
      newState.transactionSucceeded = false;
    }

    if (!newState.balanceProp){
      newState.balanceProp = this.functionsUtil.BNify(0);
    }

    // console.log('updateData',newState);

    this.setState(newState);
  }

  async loadData(){
    const availableTokens = Object.keys(this.props.toolProps.availableTokens).reduce( (output,token) => {
      const tokenConfig = this.props.toolProps.availableTokens[token];
      if (tokenConfig.enabled){
        output.push({
          value:token,
          label:token,
          ...tokenConfig
        });
      }
      return output;
    },[]);

    const selectedAction = 'Deposit';
    const selectedOption = availableTokens[0];
    const selectedToken = selectedOption.value;

    this.setState({
      selectedToken,
      selectedOption,
      selectedAction,
      availableTokens
    });
  }

  selectToken(selectedToken){
    this.setState({
      selectedToken
    });
  }

  setAction(selectedAction){
    this.setState({
      selectedAction
    });
  }

  render() {

    const isStake = this.state.selectedAction === 'Deposit';
    const isUnstake = this.state.selectedAction === 'Withdraw';
    const currentNetworkId = this.functionsUtil.getCurrentNetworkId();

    return (
      <Flex
        width={1}
        alignItems={'center'}
        flexDirection={'column'}
        justifyContent={'center'}
      >
        {
          !this.state.availableTokens ? (
            <Flex
              mt={4}
              flexDirection={'column'}
            >
              <FlexLoader
                flexProps={{
                  flexDirection:'row'
                }}
                loaderProps={{
                  size:'30px'
                }}
                textProps={{
                  ml:2
                }}
                text={'Loading tokens...'}
              />
            </Flex>
          ) : (
            <Flex
              width={1}
              alignItems={'center'}
              justifyContent={'center'}
            >
              {
                !this.state.availableTokens.length ? (
                  <Text
                    fontWeight={2}
                    fontSize={[2,3]}
                    color={'dark-gray'}
                    textAlign={'center'}
                  >
                    There are no active tokens.
                  </Text>
                ) : (
                  <Flex
                    width={[1,0.36]}
                    alignItems={'stretch'}
                    flexDirection={'column'}
                    justifyContent={'center'}
                  >
                    <Box
                      width={1}
                    >
                      <Text
                        mb={1}
                      >
                        Select Token:
                      </Text>
                      <AssetSelector
                        id={'tokens'}
                        {...this.props}
                        showBalance={false}
                        isSearchable={false}
                        onChange={this.selectToken.bind(this)}
                        selectedToken={this.state.selectedToken}
                        availableTokens={this.props.toolProps.availableTokens}
                      />
                    </Box>
                    {
                      this.state.selectedToken && (
                        <Box
                          mt={2}
                          width={1}
                        >
                          <Text
                            mb={2}
                          >
                            Choose the action:
                          </Text>
                          <Flex
                            alignItems={'center'}
                            flexDirection={'row'}
                            justifyContent={'space-between'}
                          >
                            <CardIconButton
                              {...this.props}
                              cardProps={{
                                px:3,
                                py:3,
                                width:0.48
                              }}
                              text={'Deposit'}
                              iconColor={'deposit'}
                              icon={'ArrowDownward'}
                              iconBgColor={'#ced6ff'}
                              handleClick={ e => this.setAction('Deposit') }
                              isActive={ this.state.selectedAction === 'Deposit' }
                            />
                            <CardIconButton
                              {...this.props}
                              cardProps={{
                                px:3,
                                py:3,
                                width:0.48
                              }}
                              text={'Withdraw'}
                              iconColor={'redeem'}
                              icon={'ArrowUpward'}
                              iconBgColor={'#ceeff6'}
                              handleClick={ e => this.setAction('Withdraw') }
                              isActive={ this.state.selectedAction === 'Withdraw' }
                            />
                          </Flex>
                          {
                            !this.state.availableNetworks.includes(currentNetworkId) ? (
                              <DashboardCard
                                cardProps={{
                                  p:3,
                                  mt:3,
                                  width:1
                                }}
                              >
                                <Flex
                                  alignItems={'center'}
                                  flexDirection={'column'}
                                >
                                  <Icon
                                    size={'2.3em'}
                                    name={'Warning'}
                                    color={'cellText'}
                                  />
                                  <Text
                                    mt={2}
                                    fontSize={2}
                                    color={'cellText'}
                                    textAlign={'center'}
                                  >
                                    The <strong>{this.functionsUtil.capitalize(this.props.network.current.name)} network</strong> is not supported for this function, please switch to <strong>{this.state.availableNetworks.map( networkId => this.functionsUtil.getGlobalConfig(['network','availableNetworks',networkId,'name']) ).join(' or ')} network</strong>.
                                  </Text>
                                </Flex>
                              </DashboardCard>
                            ) : (this.state.tokenConfig && this.state.balanceProp && this.state.contractInfo) ? (
                              <Box
                                mt={1}
                                width={1}
                                mb={[4,3]}
                              >
                                {
                                  !this.state.transactionSucceeded && (
                                    <DashboardCard
                                      cardProps={{
                                        p:3,
                                        mt:3,
                                        width:1
                                      }}
                                    >
                                      <Flex
                                        alignItems={'center'}
                                        flexDirection={'column'}
                                      >
                                        <Icon
                                          size={'1.8em'}
                                          color={'cellText'}
                                          name={'InfoOutline'}
                                        />
                                        <Text
                                          mt={2}
                                          fontSize={2}
                                          color={'cellText'}
                                          textAlign={'center'}
                                        >
                                          {
                                            isStake ? 'Please note that deposits require up to 10 minutes to be reflected in the Polygon chain.' : 'Please note that withdrawals from the Polygon chain take up to 2-3 hours to be completed.'
                                          }
                                        </Text>
                                      </Flex>
                                    </DashboardCard>
                                  )
                                }
                                <SendTxWithBalance
                                  {...this.props}
                                  error={this.state.error}
                                  steps={this.state.steps}
                                  infoBox={this.state.infoBox}
                                  action={this.state.selectedAction}
                                  tokenConfig={this.state.tokenConfig}
                                  tokenBalance={this.state.balanceProp}
                                  contractInfo={this.state.contractInfo}
                                  permitEnabled={this.state.permitEnabled}
                                  approveEnabled={this.state.approveEnabled}
                                  callback={this.transactionSucceeded.bind(this)}
                                  approveDescription={this.state.approveDescription}
                                  contractApproved={this.contractApproved.bind(this)}
                                  balanceSelectorInfo={this.state.balanceSelectorInfo}
                                  changeInputCallback={this.changeInputCallback.bind(this)}
                                  getTransactionParams={this.getTransactionParams.bind(this)}
                                >
                                  <DashboardCard
                                    cardProps={{
                                      p:3,
                                      mt:3
                                    }}
                                  >
                                    <Flex
                                      alignItems={'center'}
                                      flexDirection={'column'}
                                    >
                                      <Icon
                                        name={'MoneyOff'}
                                        color={'cellText'}
                                        size={this.props.isMobile ? '1.8em' : '2.3em'}
                                      />
                                      <Text
                                        mt={1}
                                        fontSize={2}
                                        color={'cellText'}
                                        textAlign={'center'}
                                      >
                                        {
                                          isStake ? (
                                            `You don't have any ${this.state.selectedToken} in your wallet.`
                                          ) : isUnstake && (
                                            `You don't have any ${this.state.selectedToken} to withdraw.`
                                          )
                                        }
                                      </Text>
                                    </Flex>
                                  </DashboardCard>
                                </SendTxWithBalance>
                              </Box>
                            ) : (
                              <Flex
                                mt={3}
                                mb={3}
                                width={1}
                              >
                                <FlexLoader
                                  flexProps={{
                                    flexDirection:'row'
                                  }}
                                  loaderProps={{
                                    size:'30px'
                                  }}
                                  textProps={{
                                    ml:2
                                  }}
                                  text={'Loading info...'}
                                />
                              </Flex>
                            )
                          }
                        </Box>
                      )
                    }
                  </Flex>
                )
              }
            </Flex>
          )
        }
      </Flex>
    );
  }
}

export default PolygonBridge;