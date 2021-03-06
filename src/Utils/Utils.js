import Title from '../Title/Title';
import IconBox from '../IconBox/IconBox';
import React, { Component } from 'react';
import Breadcrumb from '../Breadcrumb/Breadcrumb';
import FunctionsUtil from '../utilities/FunctionsUtil';
import { Flex, Icon, Text, Box, Image } from "rimble-ui";
import DashboardCard from '../DashboardCard/DashboardCard';

class Utils extends Component {

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
    const viewOnly = this.props.connectorName === 'custom';
    const showBreadCrumb = typeof this.props.showBreadCrumb !== 'undefined' ? this.props.showBreadCrumb : true;
    const SubComponent = this.props.selectedSubsection && this.props.selectedSubsection.subComponent ? this.props.selectedSubsection.subComponent : null;
    return (
      <Flex
        width={1}
        flexDirection={'column'}
      >
        {
          this.props.selectedSubsection ? (
            <Box
              width={1}
            >
              {
                showBreadCrumb && (
                  <Flex
                    width={1}
                  >
                    <Breadcrumb
                      {...this.props}
                      showPathMobile={true}
                      isMobile={this.props.isMobile}
                      path={[this.props.selectedSubsection.label]}
                      text={this.props.selectedSection.label.toUpperCase()}
                      handleClick={ e => this.props.goToSection(this.props.selectedSection.route) }
                    />
                  </Flex>
                )
              }
              <Flex
                my={[2,3]}
                flexDirection={'column'}
                justifyContent={'center'}
              >
                <Title
                  mb={2}
                >
                  {this.props.selectedSubsection.label}
                </Title>
                <Text
                  textAlign={'center'}
                >
                  {this.props.selectedSubsection.desc}
                </Text>
              </Flex>
              <SubComponent
                {...this.props}
                {...this.props.selectedSubsection.directProps}
                toolProps={this.props.selectedSubsection.props}
              />
            </Box>
          ) : (
            <Flex
              my={[2,3]}
              flexDirection={'column'}
              justifyContent={'center'}
            >
              <Title
                mb={3}
              >
                Tools
              </Title>
              <Flex
                width={1}
                style={{
                  flexWrap:'wrap'
                }}
                justifyContent={viewOnly ? 'center' : 'flex-start'}
              >
              {
                viewOnly ? (
                  <IconBox
                    cardProps={{
                      maxWidth:[1,'35em']
                    }}
                    icon={'Visibility'}
                    text={'You are using Idle in "Read-Only" mode.<br />Logout and connect with your wallet to interact.'}
                  />
                ) : this.props.selectedSection.submenu.map( (tool,toolIndex) => (
                  <DashboardCard
                    isInteractive={true}
                    key={`tool_${toolIndex}`}
                    cardProps={{
                      p:[3,4],
                      mb:[3,3],
                      mr:[0,'2%'],
                      style:{
                        flex: this.props.isMobile ? '1 1 100%' : '0 0 31%'
                      },
                      alignItems:'center',
                      flexDirection:'column',
                      justifyContent:'center'
                    }}
                    handleClick={ e => this.props.goToSection(this.props.selectedSection.route+'/'+tool.route) }
                  >
                    <Text
                      fontSize={[3,4]}
                      textAlign={'center'}
                    >
                      {tool.label}
                    </Text>
                    <Flex
                      justifyContent={'center'}
                    >
                      {
                        tool.image ? (
                          <Image
                            my={[0,2]}
                            height={'2.2em'}
                            src={tool.image}
                          />
                        ) : tool.icon && (
                          <Icon
                            my={[0,2]}
                            size={'3em'}
                            name={tool.icon}
                          />
                        )
                      }
                    </Flex>
                    <Text
                      fontSize={[2,2]}
                      textAlign={'center'}
                    >
                      {tool.desc}
                    </Text>
                  </DashboardCard>
                ) )
              }
              </Flex>
            </Flex>
          )
        }
      </Flex>
    );
  }
}

export default Utils;
