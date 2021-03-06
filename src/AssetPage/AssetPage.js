import Title from '../Title/Title';
import { Box, Flex } from "rimble-ui";
import React, { Component } from 'react';
import Breadcrumb from '../Breadcrumb/Breadcrumb';
import AssetsList from '../AssetsList/AssetsList';
import FunctionsUtil from '../utilities/FunctionsUtil';
import BuyModal from '../utilities/components/BuyModal';
import FundsOverview from '../FundsOverview/FundsOverview';
import DepositRedeem from '../DepositRedeem/DepositRedeem';
import CardIconButton from '../CardIconButton/CardIconButton';
import TransactionsList from '../TransactionsList/TransactionsList';
import EstimatedEarnings from '../EstimatedEarnings/EstimatedEarnings';

class AssetPage extends Component {

  state = {
    tokenApy:{},
    tokenFees:{},
    tokenBalance:{},
    tokenApproved:{},
    activeModal:null,
    idleTokenPrice:{},
    govTokensBalance:{},
    idleTokenBalance:{},
    redeemableBalance:{},
    govTokensDisabled:{},
    availableGovTokens:{},
    tokenFeesPercentage:{},
    componentMounted:false,
    govTokensUserBalances:{}
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

  resetModal = () => {
    this.setState({
      activeModal: null
    });
  }

  setActiveModal = activeModal => {
    this.setState({
      activeModal
    });
  }

  async loadTokensInfo(){
    if (this.props.account){
      const newState = {...this.state};
      await this.functionsUtil.asyncForEach(Object.keys(this.props.availableTokens),async (token) => {
        const tokenConfig = this.props.availableTokens[token];
        const govTokenAvailableTokens = {};
        govTokenAvailableTokens[token] = tokenConfig;

        const [
          tokenFeesPercentage,
          idleTokenPrice,
          tokenApy,
          tokenBalance,
          tokenFees,
          idleTokenBalance,
          tokenApproved,
          govTokensUserBalances,
          govTokensBalance
        ] = await Promise.all([
          this.functionsUtil.getTokenFees(tokenConfig),
          this.functionsUtil.getIdleTokenPrice(tokenConfig),
          this.functionsUtil.getTokenApy(this.props.tokenConfig),
          this.functionsUtil.getTokenBalance(token,this.props.account),
          this.functionsUtil.getUserTokenFees(tokenConfig,this.props.account),
          this.functionsUtil.getTokenBalance(tokenConfig.idle.token,this.props.account),
          this.functionsUtil.checkTokenApproved(token,tokenConfig.idle.address,this.props.account),
          this.functionsUtil.getGovTokensUserBalances(this.props.account,govTokenAvailableTokens,null,null),
          this.functionsUtil.getGovTokensUserTotalBalance(this.props.account,govTokenAvailableTokens,'DAI',false)
        ]);

        newState.tokenFees[token] = tokenFees;
        newState.tokenBalance[token] = tokenBalance;
        newState.tokenApproved[token] = tokenApproved;
        newState.idleTokenPrice[token] = idleTokenPrice;
        newState.idleTokenBalance[token] = idleTokenBalance;
        newState.govTokensBalance[token] = govTokensBalance;
        newState.tokenFeesPercentage[token] = tokenFeesPercentage;
        newState.govTokensUserBalances[token] = govTokensUserBalances;
        newState.govTokensDisabled[token] = tokenConfig.govTokensDisabled;
        newState.tokenApy[token] = tokenApy && !tokenApy.isNaN() ? tokenApy : null;
        newState.redeemableBalance[token] = idleTokenBalance && idleTokenPrice ? idleTokenBalance.times(idleTokenPrice) : this.functionsUtil.BNify(0);
      });

      newState.availableGovTokens = this.functionsUtil.getTokenGovTokens(this.props.tokenConfig);

      // console.log('govTokensBalance',newState.govTokensBalance);
      // console.log('availableGovTokens',newState.availableGovTokens);
      // console.log('govTokensUserBalances',newState.govTokensUserBalances);

      newState.componentMounted = true;

      this.setState(newState);
    }
  }

  async componentWillMount(){
    this.loadUtils();
    await this.loadTokensInfo();
  }

  async componentDidUpdate(prevProps, prevState) {
    this.loadUtils();
    const accountChanged = prevProps.account !== this.props.account;
    const availableTokensChanged = JSON.stringify(prevProps.availableTokens) !== JSON.stringify(this.props.availableTokens);
    const transactionsChanged = prevProps.transactions && this.props.transactions && Object.values(prevProps.transactions).filter(tx => (tx.status==='success')).length !== Object.values(this.props.transactions).filter(tx => (tx.status==='success')).length;
    if (accountChanged || transactionsChanged || availableTokensChanged){
      // console.log('AssetPage - availableTokensChanged',availableTokensChanged);
      this.loadTokensInfo();
    }
  }

  render() {

    const userHasFunds = this.props.account && this.state.idleTokenBalance[this.props.selectedToken] && this.functionsUtil.BNify(this.state.idleTokenBalance[this.props.selectedToken]).gt(0);

    return (
      <Box
        width={1}
      >
        <Flex
          width={1}
          mb={[3,4]}
          alignItems={'center'}
          flexDirection={'row'}
          justifyContent={'flex-start'}
        >
          <Flex
            width={0.5}
          >
            <Breadcrumb
              {...this.props}
              isMobile={this.props.isMobile}
              path={[this.props.selectedToken]}
              handleClick={ e => this.props.goToSection(this.props.selectedStrategy) }
              text={this.functionsUtil.getGlobalConfig(['strategies',this.props.selectedStrategy,'title'])}
            />
          </Flex>
          <Flex
            width={0.5}
            justifyContent={'flex-end'}
          >
            <CardIconButton
              icon={'Add'}
              {...this.props}
              text={'Add funds'}
              handleClick={ e => this.setActiveModal('buy') }
            />
          </Flex>
        </Flex>
        <Title
          mb={[3,4]}
        >
          Deposit / Redeem
        </Title>
        <Flex
          width={1}
        >
          <DepositRedeem
            {...this.props}
            tokenFees={this.state.tokenFees[this.props.selectedToken]}
            tokenBalance={this.state.tokenBalance[this.props.selectedToken]}
            tokenApproved={this.state.tokenApproved[this.props.selectedToken]}
            govTokensBalance={this.state.govTokensBalance[this.props.selectedToken]}
            idleTokenBalance={this.state.idleTokenBalance[this.props.selectedToken]}
            redeemableBalance={this.state.redeemableBalance[this.props.selectedToken]}
            tokenFeesPercentage={this.state.tokenFeesPercentage[this.props.selectedToken]}
            govTokensUserBalances={this.state.govTokensUserBalances[this.props.selectedToken]}
          />
        </Flex>
        {
          userHasFunds &&
            <Flex
              mb={[0,4]}
              width={1}
              flexDirection={'column'}
              id={'funds-overview-container'}
            >
              <Title my={[3,4]}>Funds Overview</Title>
              <FundsOverview
                {...this.props}
                tokenFees={this.state.tokenFees[this.props.selectedToken]}
              />
            </Flex>
        }
        {
          userHasFunds && this.props.account && !this.state.govTokensDisabled[this.props.selectedToken] && Object.keys(this.state.availableGovTokens).length>0 && 
            <Flex
              width={1}
              id={"yield-farming"}
              flexDirection={'column'}
            >
              <Title my={[3,4]}>Yield Farming</Title>
              <AssetsList
                enabledTokens={Object.keys(this.state.availableGovTokens)}
                cols={[
                  {
                    title:'TOKEN',
                    props:{
                      width:[0.30,0.15]
                    },
                    fields:[
                      {
                        name:'icon',
                        props:{
                          mr:2,
                          height:['1.4em','2.3em']
                        }
                      },
                      {
                        name:'tokenName'
                      }
                    ]
                  },
                  {
                    mobile:false,
                    title:'BALANCE',
                    props:{
                      width:[0.33, 0.25],
                    },
                    fields:[
                      {
                        name:'tokenBalance',
                        props:{
                          decimals: this.props.isMobile ? 6 : 8
                        }
                      }
                    ]
                  },
                  {
                    title:'REDEEMABLE',
                    desc:this.functionsUtil.getGlobalConfig(['messages','govTokenRedeemableBalance']),
                    props:{
                      width:[0.35,0.30],
                      justifyContent:['center','flex-start']
                    },
                    fields:[
                      {
                        name:'redeemableBalance',
                        props:{
                          decimals: this.props.isMobile ? 6 : 8
                        }
                      },
                    ]
                  },
                  {
                    title:'DISTRIBUTION',
                    desc:this.functionsUtil.getGlobalConfig(['messages','userDistributionSpeed']),
                    props:{
                      width:[0.35,0.30],
                    },
                    fields:[
                      {
                        name:'userDistributionSpeed',
                        props:{
                          decimals:6
                        }
                      }
                    ]
                  },
                  /*
                  {
                    title:'APR',
                    desc:this.functionsUtil.getGlobalConfig(['messages','govTokenApr']),
                    props:{
                      width:[0.2,0.17],
                    },
                    fields:[
                      {
                        name:'apr',
                      }
                    ]
                  },
                  {
                    title:'TOKEN PRICE',
                    desc:this.functionsUtil.getGlobalConfig(['messages','tokenPrice']),
                    mobile:false,
                    props:{
                      width: 0.17,
                    },
                    parentProps:{
                      width:1,
                      pr:[2,4]
                    },
                    fields:[
                      {
                        name:'tokenPrice',
                        props:{
                          unit:'$',
                          unitPos:'left',
                          unitProps:{
                            mr:1,
                            fontWeight:3,
                            fontSize:[0,2],
                            color:'cellText'
                          }
                        }
                      }
                    ]
                  },
                  */
                ]}
                {...this.props}
                availableTokens={this.state.availableGovTokens}
              />
            </Flex>
        }
        {
        this.props.account && this.state.tokenApy[this.props.selectedToken] && 
          <Flex
            mb={[3,4]}
            width={1}
            flexDirection={'column'}
            id={'estimated-earnings-container'}
          >
            <Title my={[3,4]}>Estimated earnings</Title>
            <EstimatedEarnings
              {...this.props}
              tokenApy={this.state.tokenApy[this.props.selectedToken]}
            />
          </Flex>
        }
        {
        this.props.account && 
          <Flex
            mb={[3,4]}
            width={1}
            flexDirection={'column'}
            id={'transactions-container'}
          >
            <Title my={[3,4]}>Transactions</Title>
            <TransactionsList
              {...this.props}
              enabledTokens={[this.props.selectedToken]}
              cols={[
                {
                  title: this.props.isMobile ? '' : 'HASH',
                  props:{
                    width:[0.15,0.24]
                  },
                  fields:[
                    {
                      name:'icon',
                      props:{
                        mr:[0,2]
                      }
                    },
                    {
                      name:'hash',
                      mobile:false
                    }
                  ]
                },
                {
                  title:'ACTION',
                  mobile:false,
                  props:{
                    width:0.15,
                  },
                  fields:[
                    {
                      name:'action'
                    }
                  ]
                },
                {
                  title:'DATE',
                  props:{
                    width:[0.32,0.23],
                  },
                  fields:[
                    {
                      name:'date'
                    }
                  ]
                },
                {
                  title:'STATUS',
                  props:{
                    width:[0.18,0.22],
                    justifyContent:['center','flex-start']
                  },
                  fields:[
                    {
                      name:'statusIcon',
                      props:{
                        mr:[0,2]
                      }
                    },
                    {
                      mobile:false,
                      name:'status'
                    }
                  ]
                },
                {
                  title:'AMOUNT',
                  props:{
                    width:0.19,
                  },
                  fields:[
                    {
                      name:'amount'
                    },
                  ]
                },
                {
                  title:'ASSET',
                  props:{
                    width:[0.15,0.20],
                    justifyContent:['center','flex-start']
                  },
                  fields:[
                    {
                      name:'tokenIcon',
                      props:{
                        mr:[0,2],
                        height:['1.4em','1.6em']
                      }
                    },
                    {
                      mobile:false,
                      name:'tokenName'
                    },
                  ]
                },
              ]}
            />
          </Flex>
        }

        <BuyModal
          {...this.props}
          closeModal={this.resetModal}
          buyToken={this.props.selectedToken}
          isOpen={this.state.activeModal === 'buy'}
        />
      </Box>
    );
  }
}

export default AssetPage;