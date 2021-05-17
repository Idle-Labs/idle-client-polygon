import React, { Component } from 'react';
import { Flex, Text, Box } from "rimble-ui";
import FunctionsUtil from '../utilities/FunctionsUtil';
import DashboardCard from '../DashboardCard/DashboardCard';

class NetworkIndicator extends Component {

  // Utils
  functionsUtil = null;

  loadUtils(){
    if (this.functionsUtil){
      this.functionsUtil.setProps(this.props);
    } else {
      this.functionsUtil = new FunctionsUtil(this.props);
    }
  }

  async componentWillMount(){
    this.loadUtils();
  }

  async componentDidUpdate(prevProps,prevState){
    this.loadUtils();
  }

  render() {
    return (
      <DashboardCard
        {...this.props}
        cardProps={{
          px:[1,2],
          display:'flex',
          width:[1,'auto']
        }}
        isInteractive={false}
      >
        <Flex
          py={0}
          px={1}
          width={1}
          alignItems={'center'}
          flexDirection={'row'}
          height={['38px','42px']}
          justifyContent={['center','flex-start']}
        >
          <Box
            mr={2}
            width={'9px'}
            height={'9px'}
            borderRadius={'50%'}
            backgroundColor={this.props.network.isCorrectNetwork ? '#00b84a' : '#fa0000'}
          >
          </Box>
          <Text
            fontSize={[0,1]}
            fontWeight={2}
            color={'copyColor'}
          >
            {this.functionsUtil.capitalize(this.props.network.current.name)}
          </Text>
        </Flex>
      </DashboardCard>
    );
  }
}

export default NetworkIndicator;