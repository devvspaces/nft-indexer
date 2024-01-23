import { AttachmentIcon, CheckIcon, MoonIcon, SunIcon } from '@chakra-ui/icons';
import {
  Box,
  Button,
  Center,
  Flex,
  Heading,
  Image,
  Input,
  SimpleGrid,
  Text,
  useToast,
  useColorMode,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  HStack,
  IconButton,
  Stack,
  Link,
} from '@chakra-ui/react';
import { Alchemy, Network } from 'alchemy-sdk';
import { ethers } from 'ethers';
import { useState } from 'react';

const provider = new ethers.providers.Web3Provider(window.ethereum);
const API_KEY = 'HDXAVgF8TmPd_zLuksAv4R6y6ShHrYly';

function App() {
  const [userAddress, setUserAddress] = useState('');
  const [results, setResults] = useState([]);
  const [hasQueried, setHasQueried] = useState(false);
  const [tokenDataObjects, setTokenDataObjects] = useState([]);
  const [isLoadingWallet, setIsLoadingWallet] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const toast = useToast();
  const { colorMode, toggleColorMode } = useColorMode();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isOpenNft, onOpen: onOpenNft, onClose: onCloseNft } = useDisclosure();

  const [defaultAccount, setDefaultAccount] = useState(null);
  const [userBalance, setUserBalance] = useState(null);

  const [selectedNft, selectNft] = useState(null);

  const connectWalletHandler = () => {
    if (window.ethereum) {
      setIsLoadingWallet(true);
      provider.send("eth_requestAccounts", []).then(async () => {
        await accountChangedHandler(provider.getSigner());
      })
    } else {
      toast({
        title: 'Error',
        description: 'Please Install Metamask!!!',
        status: 'error',
        duration: 3000,
        isClosable: true,
        position: 'top',
      });
    }
  }

  const accountChangedHandler = async (newAccount) => {
    const address = await newAccount.getAddress();
    setDefaultAccount(address);
    const balance = await newAccount.getBalance()
    setUserBalance(ethers.utils.formatEther(balance));
    setIsLoadingWallet(false);
  }

  async function getNFTs(address) {
    setTokenDataObjects([]);
    setResults([]);
    setIsLoading(true);
    const config = {
      apiKey: API_KEY,
      network: Network.ETH_MAINNET,
    };

    const alchemy = new Alchemy(config);
    try {
      const data = await alchemy.nft.getNftsForOwner(address);

      const tokenDataPromises = [];

      if (data.ownedNfts.length === 0) {
        toast({
          title: 'Error',
          description: 'No NFTs found for this address!',
          status: 'error',
          duration: 3000,
          isClosable: true,
          position: 'top',
        });
        setIsLoading(false);
        return;
      }

      for (let i = 0; i < data.ownedNfts.length; i++) {
        const tokenData = alchemy.nft.getNftMetadata(
          data.ownedNfts[i].contract.address,
          data.ownedNfts[i].tokenId
        );
        tokenDataPromises.push(tokenData);
      }

      if (tokenDataPromises.length === 0) {
        toast({
          title: 'Error',
          description: 'No NFTs found for this address!',
          status: 'error',
          duration: 3000,
          isClosable: true,
          position: 'top',
        });
        setIsLoading(false);
        return;
      }

      setResults(data);
      setTokenDataObjects(await Promise.all(tokenDataPromises));
      setHasQueried(true);
    } catch (e) {
      toast({
        title: 'Error',
        description: 'Please enter a valid address!',
        status: 'error',
        duration: 3000,
        isClosable: true,
        position: 'top',
      });
    }
    setIsLoading(false);
  }

  async function getNFTsForOwner() {
    if (!userAddress) {
      toast({
        title: 'Error',
        description: 'Please enter an address!',
        status: 'error',
        duration: 3000,
        isClosable: true,
        position: 'top',
      });
      return;
    }
    await getNFTs(userAddress);
  }

  function limitText(str, len = 15) {
    if (str?.length > 10) {
      return str.substring(0, len) + "...";
    }
    return str;
  }

  function convertIpfsUrlToGatewayUrl(url) {
    return url.replace('ipfs://', 'https://ipfs.io/ipfs/');
  }

  function getImageUrl(image) {
    if (image.startsWith('ipfs://')) {
      return convertIpfsUrlToGatewayUrl(image);
    }
    return image;
  }

  return (
    <Box py={10} px={5}>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Connect Wallet</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {
              defaultAccount ? (<Box textAlign={'center'} py={5}>
                <Stack gap={'1rem'}>
                  <Text><strong>Wallet Address:</strong> {defaultAccount}</Text>
                  <Text><strong>Wallet Balance:</strong> {userBalance}</Text>
                </Stack>
                <Button isLoading={isLoading} colorScheme='blue' mt={8} onClick={async () => {
                  onClose();
                  setUserAddress(defaultAccount);
                  await getNFTs(defaultAccount)
                }} variant='solid'>Get NFTs</Button>
              </Box>) : (<Text>You have not connected your wallet yet!!</Text>)
            }
          </ModalBody>

          <ModalFooter justifyContent={'space-between'}>
            <Button isDisabled={defaultAccount} colorScheme='blue' isLoading={isLoadingWallet} onClick={connectWalletHandler} variant={'outline'}>Connect Wallet</Button>
            <Button colorScheme='red' mr={3} onClick={onClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={isOpenNft} onClose={onCloseNft}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{selectedNft?.title}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Flex wrap={'wrap'} gap={'1rem'} pos={'relative'}>
              <Image
                src={
                  selectedNft?.rawMetadata?.image ? getImageUrl(selectedNft?.rawMetadata?.image) :
                    'https://via.placeholder.com/200'
                }
                fallbackSrc='https://via.placeholder.com/200'
                alt={'Image'}
              />
              <Text color={'white'} position={'absolute'} top={2} right={2} m={0} p={1} px={2} rounded={'md'} bg={'gray.900'}>#{selectedNft?.tokenId}</Text>
              <Text>{selectedNft?.description?.split('\\n').join(' ')}</Text>
            </Flex>
          </ModalBody>
          <ModalFooter justifyContent={'space-between'}>
            <Link target={'_blank'} href={selectedNft?.rawMetadata?.external_url}>
              <Button colorScheme='blue' mr={3}>
                Visit URL
              </Button>
            </Link>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Center>
        <Flex
          alignItems={'center'}
          justifyContent="center"
          flexDirection={'column'}
        >
          <HStack>
            <IconButton
              variant='outline'
              colorScheme='blue'
              icon={colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
              onClick={toggleColorMode}
              mb={5}
            />
            <IconButton
              variant='outline'
              colorScheme='blue'
              icon={!defaultAccount ? <AttachmentIcon /> : <CheckIcon />}
              onClick={onOpen}
              mb={5}
            />
          </HStack>
          <Heading mb={1} fontSize={36}>
            NFT Indexer 🖼
          </Heading>
          <Text>
            Plug in an address and this website will return all of its NFTs!
          </Text>
        </Flex>
      </Center>
      <Flex
        flexDirection="column"
        alignItems="center"
        justifyContent={'center'}
        gap={'1rem'}
      >
        <Heading mt={42}>Get all the ERC-721 tokens of this address:</Heading>
        <Input
          onChange={(e) => setUserAddress(e.target.value)}
          color="black"
          w="600px"
          textAlign="center"
          p={4}
          bgColor="white"
          fontSize={24}
          value={userAddress || ''}
        />
        <Button isLoading={isLoading} size={'lg'} onClick={getNFTsForOwner} colorScheme="blue">
          Fetch Collection
        </Button>

        <Heading mt={'5rem'}>Here are your NFTs:</Heading>

        {hasQueried ? (
          <Flex wrap={'wrap'} gap={'1rem'} justify={'center'}>
            {results && results.ownedNfts?.map((e, i) => {
              return (
                <Flex
                  flexDir={'column'}
                  color="white"
                  key={i}
                  w={'300px'}
                  rounded={'lg'}
                  bg={'gray.600'}
                  overflow={'hidden'}
                  onClick={() => {
                    selectNft(tokenDataObjects[i]);
                    onOpenNft();
                  }}
                  cursor={'pointer'}
                  pos={'relative'}
                >
                  <Image
                    src={
                      tokenDataObjects[i]?.rawMetadata?.image ? getImageUrl(tokenDataObjects[i]?.rawMetadata?.image) :
                        'https://via.placeholder.com/200'
                    }
                    fallbackSrc='https://via.placeholder.com/200'
                    alt={'Image'}
                  />
                  <Text position={'absolute'} top={2} right={2} m={0} p={1} px={2} rounded={'md'} bg={'#1719238a'}>#{tokenDataObjects[i]?.tokenId}</Text>
                  <Box py={5} px={2}>
                    <Text fontSize={18}>
                      <strong>Name:</strong>{' '}
                      <span>{tokenDataObjects[i]?.title === 0
                        ? 'No Name'
                        : tokenDataObjects[i]?.rawMetadata?.name}</span>
                    </Text>
                    <Text fontSize={18}>
                      <strong>Description:</strong>{' '}
                      <span>{(limitText(tokenDataObjects[i]?.description?.split('\\n').join(' '), 30)) || 'No Description'}</span>
                    </Text>
                  </Box>
                </Flex>
              );
            })}
            {!results && (
              <Text fontSize={24}>No NFTs found for this address!</Text>
            )}
          </Flex>
        ) : (
          'Please make a query! The query may take a few seconds...'
        )}
      </Flex>
    </Box>
  );
}

export default App;
