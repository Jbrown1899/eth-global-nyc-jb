interface ContractsConfig {
    [chainId: number]: {
        canvasGen: string
    }
}

export const chainsToContracts: ContractsConfig = {
    84532: {
        canvasGen: "TBD"
    },
}

export const canvasGenAbi = [
        {
            "type": "constructor",
            "inputs": [],
            "stateMutability": "nonpayable"
        },
        {
            "type": "function",
            "name": "DEFAULT_COLOR",
            "inputs": [],
            "outputs": [
                {
                    "name": "",
                    "type": "uint8",
                    "internalType": "uint8"
                }
            ],
            "stateMutability": "view"
        },
        {
            "type": "function",
            "name": "approve",
            "inputs": [
                {
                    "name": "to",
                    "type": "address",
                    "internalType": "address"
                },
                {
                    "name": "tokenId",
                    "type": "uint256",
                    "internalType": "uint256"
                }
            ],
            "outputs": [],
            "stateMutability": "nonpayable"
        },
        {
            "type": "function",
            "name": "balanceOf",
            "inputs": [
                {
                    "name": "owner",
                    "type": "address",
                    "internalType": "address"
                }
            ],
            "outputs": [
                {
                    "name": "",
                    "type": "uint256",
                    "internalType": "uint256"
                }
            ],
            "stateMutability": "view"
        },
        {
            "type": "function",
            "name": "burn",
            "inputs": [
                {
                    "name": "tokenId",
                    "type": "uint256",
                    "internalType": "uint256"
                }
            ],
            "outputs": [],
            "stateMutability": "nonpayable"
        },
        {
            "type": "function",
            "name": "claim",
            "inputs": [
                {
                    "name": "canvasId",
                    "type": "uint256",
                    "internalType": "uint256"
                },
                {
                    "name": "imageCid",
                    "type": "string",
                    "internalType": "string"
                }
            ],
            "outputs": [],
            "stateMutability": "nonpayable"
        },
        {
            "type": "function",
            "name": "generateCanvas",
            "inputs": [
                {
                    "name": "x",
                    "type": "uint32",
                    "internalType": "uint32"
                },
                {
                    "name": "y",
                    "type": "uint32",
                    "internalType": "uint32"
                },
                {
                    "name": "maxDurationBlocks",
                    "type": "uint256",
                    "internalType": "uint256"
                }
            ],
            "outputs": [
                {
                    "name": "canvasId",
                    "type": "uint256",
                    "internalType": "uint256"
                }
            ],
            "stateMutability": "nonpayable"
        },
        {
            "type": "function",
            "name": "getApproved",
            "inputs": [
                {
                    "name": "tokenId",
                    "type": "uint256",
                    "internalType": "uint256"
                }
            ],
            "outputs": [
                {
                    "name": "",
                    "type": "address",
                    "internalType": "address"
                }
            ],
            "stateMutability": "view"
        },
        {
            "type": "function",
            "name": "getCanvas",
            "inputs": [
                {
                    "name": "canvasId",
                    "type": "uint256",
                    "internalType": "uint256"
                }
            ],
            "outputs": [
                {
                    "name": "",
                    "type": "tuple",
                    "internalType": "struct CanvasGen.CanvasConfig",
                    "components": [
                        {
                            "name": "x",
                            "type": "uint32",
                            "internalType": "uint32"
                        },
                        {
                            "name": "y",
                            "type": "uint32",
                            "internalType": "uint32"
                        },
                        {
                            "name": "startBlock",
                            "type": "uint256",
                            "internalType": "uint256"
                        },
                        {
                            "name": "maxDurationBlocks",
                            "type": "uint256",
                            "internalType": "uint256"
                        },
                        {
                            "name": "isComplete",
                            "type": "bool",
                            "internalType": "bool"
                        },
                        {
                            "name": "isClaimed",
                            "type": "bool",
                            "internalType": "bool"
                        },
                        {
                            "name": "mostRecentUpdatedBlock",
                            "type": "uint256",
                            "internalType": "uint256"
                        },
                        {
                            "name": "owner",
                            "type": "address",
                            "internalType": "address"
                        },
                        {
                            "name": "imageCid",
                            "type": "string",
                            "internalType": "string"
                        }
                    ]
                }
            ],
            "stateMutability": "view"
        },
        {
            "type": "function",
            "name": "getPixel",
            "inputs": [
                {
                    "name": "canvasId",
                    "type": "uint256",
                    "internalType": "uint256"
                },
                {
                    "name": "x",
                    "type": "uint32",
                    "internalType": "uint32"
                },
                {
                    "name": "y",
                    "type": "uint32",
                    "internalType": "uint32"
                }
            ],
            "outputs": [
                {
                    "name": "",
                    "type": "uint8",
                    "internalType": "uint8"
                }
            ],
            "stateMutability": "view"
        },
        {
            "type": "function",
            "name": "isApprovedForAll",
            "inputs": [
                {
                    "name": "owner",
                    "type": "address",
                    "internalType": "address"
                },
                {
                    "name": "operator",
                    "type": "address",
                    "internalType": "address"
                }
            ],
            "outputs": [
                {
                    "name": "",
                    "type": "bool",
                    "internalType": "bool"
                }
            ],
            "stateMutability": "view"
        },
        {
            "type": "function",
            "name": "name",
            "inputs": [],
            "outputs": [
                {
                    "name": "",
                    "type": "string",
                    "internalType": "string"
                }
            ],
            "stateMutability": "view"
        },
        {
            "type": "function",
            "name": "ownerOf",
            "inputs": [
                {
                    "name": "tokenId",
                    "type": "uint256",
                    "internalType": "uint256"
                }
            ],
            "outputs": [
                {
                    "name": "",
                    "type": "address",
                    "internalType": "address"
                }
            ],
            "stateMutability": "view"
        },
        {
            "type": "function",
            "name": "safeTransferFrom",
            "inputs": [
                {
                    "name": "from",
                    "type": "address",
                    "internalType": "address"
                },
                {
                    "name": "to",
                    "type": "address",
                    "internalType": "address"
                },
                {
                    "name": "tokenId",
                    "type": "uint256",
                    "internalType": "uint256"
                }
            ],
            "outputs": [],
            "stateMutability": "nonpayable"
        },
        {
            "type": "function",
            "name": "safeTransferFrom",
            "inputs": [
                {
                    "name": "from",
                    "type": "address",
                    "internalType": "address"
                },
                {
                    "name": "to",
                    "type": "address",
                    "internalType": "address"
                },
                {
                    "name": "tokenId",
                    "type": "uint256",
                    "internalType": "uint256"
                },
                {
                    "name": "data",
                    "type": "bytes",
                    "internalType": "bytes"
                }
            ],
            "outputs": [],
            "stateMutability": "nonpayable"
        },
        {
            "type": "function",
            "name": "setApprovalForAll",
            "inputs": [
                {
                    "name": "operator",
                    "type": "address",
                    "internalType": "address"
                },
                {
                    "name": "approved",
                    "type": "bool",
                    "internalType": "bool"
                }
            ],
            "outputs": [],
            "stateMutability": "nonpayable"
        },
        {
            "type": "function",
            "name": "setPixel",
            "inputs": [
                {
                    "name": "canvasId",
                    "type": "uint256",
                    "internalType": "uint256"
                },
                {
                    "name": "x",
                    "type": "uint32",
                    "internalType": "uint32"
                },
                {
                    "name": "y",
                    "type": "uint32",
                    "internalType": "uint32"
                },
                {
                    "name": "newColor",
                    "type": "uint8",
                    "internalType": "uint8"
                }
            ],
            "outputs": [],
            "stateMutability": "nonpayable"
        },
        {
            "type": "function",
            "name": "supportsInterface",
            "inputs": [
                {
                    "name": "interfaceId",
                    "type": "bytes4",
                    "internalType": "bytes4"
                }
            ],
            "outputs": [
                {
                    "name": "",
                    "type": "bool",
                    "internalType": "bool"
                }
            ],
            "stateMutability": "view"
        },
        {
            "type": "function",
            "name": "symbol",
            "inputs": [],
            "outputs": [
                {
                    "name": "",
                    "type": "string",
                    "internalType": "string"
                }
            ],
            "stateMutability": "view"
        },
        {
            "type": "function",
            "name": "tokenURI",
            "inputs": [
                {
                    "name": "canvasId",
                    "type": "uint256",
                    "internalType": "uint256"
                }
            ],
            "outputs": [
                {
                    "name": "",
                    "type": "string",
                    "internalType": "string"
                }
            ],
            "stateMutability": "view"
        },
        {
            "type": "function",
            "name": "transferFrom",
            "inputs": [
                {
                    "name": "from",
                    "type": "address",
                    "internalType": "address"
                },
                {
                    "name": "to",
                    "type": "address",
                    "internalType": "address"
                },
                {
                    "name": "tokenId",
                    "type": "uint256",
                    "internalType": "uint256"
                }
            ],
            "outputs": [],
            "stateMutability": "nonpayable"
        },
        {
            "type": "event",
            "name": "Approval",
            "inputs": [
                {
                    "name": "owner",
                    "type": "address",
                    "indexed": true,
                    "internalType": "address"
                },
                {
                    "name": "approved",
                    "type": "address",
                    "indexed": true,
                    "internalType": "address"
                },
                {
                    "name": "tokenId",
                    "type": "uint256",
                    "indexed": true,
                    "internalType": "uint256"
                }
            ],
            "anonymous": false
        },
        {
            "type": "event",
            "name": "ApprovalForAll",
            "inputs": [
                {
                    "name": "owner",
                    "type": "address",
                    "indexed": true,
                    "internalType": "address"
                },
                {
                    "name": "operator",
                    "type": "address",
                    "indexed": true,
                    "internalType": "address"
                },
                {
                    "name": "approved",
                    "type": "bool",
                    "indexed": false,
                    "internalType": "bool"
                }
            ],
            "anonymous": false
        },
        {
            "type": "event",
            "name": "CanvasClaimed",
            "inputs": [
                {
                    "name": "canvasId",
                    "type": "uint256",
                    "indexed": true,
                    "internalType": "uint256"
                },
                {
                    "name": "owner",
                    "type": "address",
                    "indexed": true,
                    "internalType": "address"
                }
            ],
            "anonymous": false
        },
        {
            "type": "event",
            "name": "CanvasGenerated",
            "inputs": [
                {
                    "name": "canvasId",
                    "type": "uint256",
                    "indexed": true,
                    "internalType": "uint256"
                },
                {
                    "name": "owner",
                    "type": "address",
                    "indexed": true,
                    "internalType": "address"
                },
                {
                    "name": "config",
                    "type": "tuple",
                    "indexed": false,
                    "internalType": "struct CanvasGen.CanvasConfig",
                    "components": [
                        {
                            "name": "x",
                            "type": "uint32",
                            "internalType": "uint32"
                        },
                        {
                            "name": "y",
                            "type": "uint32",
                            "internalType": "uint32"
                        },
                        {
                            "name": "startBlock",
                            "type": "uint256",
                            "internalType": "uint256"
                        },
                        {
                            "name": "maxDurationBlocks",
                            "type": "uint256",
                            "internalType": "uint256"
                        },
                        {
                            "name": "isComplete",
                            "type": "bool",
                            "internalType": "bool"
                        },
                        {
                            "name": "isClaimed",
                            "type": "bool",
                            "internalType": "bool"
                        },
                        {
                            "name": "mostRecentUpdatedBlock",
                            "type": "uint256",
                            "internalType": "uint256"
                        },
                        {
                            "name": "owner",
                            "type": "address",
                            "internalType": "address"
                        },
                        {
                            "name": "imageCid",
                            "type": "string",
                            "internalType": "string"
                        }
                    ]
                }
            ],
            "anonymous": false
        },
        {
            "type": "event",
            "name": "PixelColored",
            "inputs": [
                {
                    "name": "editor",
                    "type": "address",
                    "indexed": true,
                    "internalType": "address"
                },
                {
                    "name": "canvasId",
                    "type": "uint256",
                    "indexed": true,
                    "internalType": "uint256"
                },
                {
                    "name": "x",
                    "type": "uint32",
                    "indexed": true,
                    "internalType": "uint32"
                },
                {
                    "name": "y",
                    "type": "uint32",
                    "indexed": false,
                    "internalType": "uint32"
                },
                {
                    "name": "color",
                    "type": "uint8",
                    "indexed": false,
                    "internalType": "uint8"
                }
            ],
            "anonymous": false
        },
        {
            "type": "event",
            "name": "Transfer",
            "inputs": [
                {
                    "name": "from",
                    "type": "address",
                    "indexed": true,
                    "internalType": "address"
                },
                {
                    "name": "to",
                    "type": "address",
                    "indexed": true,
                    "internalType": "address"
                },
                {
                    "name": "tokenId",
                    "type": "uint256",
                    "indexed": true,
                    "internalType": "uint256"
                }
            ],
            "anonymous": false
        },
        {
            "type": "error",
            "name": "CanvasAlreadyClaimed",
            "inputs": [
                {
                    "name": "canvasId",
                    "type": "uint256",
                    "internalType": "uint256"
                }
            ]
        },
        {
            "type": "error",
            "name": "CanvasAlreadyExistsTryAgain",
            "inputs": []
        },
        {
            "type": "error",
            "name": "CanvasFinished",
            "inputs": [
                {
                    "name": "canvasId",
                    "type": "uint256",
                    "internalType": "uint256"
                }
            ]
        },
        {
            "type": "error",
            "name": "CanvasNotFinished",
            "inputs": [
                {
                    "name": "canvasId",
                    "type": "uint256",
                    "internalType": "uint256"
                }
            ]
        },
        {
            "type": "error",
            "name": "CoordinatesCantBeZero",
            "inputs": [
                {
                    "name": "x",
                    "type": "uint32",
                    "internalType": "uint32"
                },
                {
                    "name": "y",
                    "type": "uint32",
                    "internalType": "uint32"
                }
            ]
        },
        {
            "type": "error",
            "name": "CoordinatesOOB",
            "inputs": [
                {
                    "name": "x",
                    "type": "uint32",
                    "internalType": "uint32"
                },
                {
                    "name": "y",
                    "type": "uint32",
                    "internalType": "uint32"
                }
            ]
        },
        {
            "type": "error",
            "name": "DurationCantBeZero",
            "inputs": [
                {
                    "name": "maxDurationBlocks",
                    "type": "uint256",
                    "internalType": "uint256"
                }
            ]
        },
        {
            "type": "error",
            "name": "ERC721IncorrectOwner",
            "inputs": [
                {
                    "name": "sender",
                    "type": "address",
                    "internalType": "address"
                },
                {
                    "name": "tokenId",
                    "type": "uint256",
                    "internalType": "uint256"
                },
                {
                    "name": "owner",
                    "type": "address",
                    "internalType": "address"
                }
            ]
        },
        {
            "type": "error",
            "name": "ERC721InsufficientApproval",
            "inputs": [
                {
                    "name": "operator",
                    "type": "address",
                    "internalType": "address"
                },
                {
                    "name": "tokenId",
                    "type": "uint256",
                    "internalType": "uint256"
                }
            ]
        },
        {
            "type": "error",
            "name": "ERC721InvalidApprover",
            "inputs": [
                {
                    "name": "approver",
                    "type": "address",
                    "internalType": "address"
                }
            ]
        },
        {
            "type": "error",
            "name": "ERC721InvalidOperator",
            "inputs": [
                {
                    "name": "operator",
                    "type": "address",
                    "internalType": "address"
                }
            ]
        },
        {
            "type": "error",
            "name": "ERC721InvalidOwner",
            "inputs": [
                {
                    "name": "owner",
                    "type": "address",
                    "internalType": "address"
                }
            ]
        },
        {
            "type": "error",
            "name": "ERC721InvalidReceiver",
            "inputs": [
                {
                    "name": "receiver",
                    "type": "address",
                    "internalType": "address"
                }
            ]
        },
        {
            "type": "error",
            "name": "ERC721InvalidSender",
            "inputs": [
                {
                    "name": "sender",
                    "type": "address",
                    "internalType": "address"
                }
            ]
        },
        {
            "type": "error",
            "name": "ERC721InvalidToken",
            "inputs": []
        },
        {
            "type": "error",
            "name": "ERC721NonexistentToken",
            "inputs": [
                {
                    "name": "tokenId",
                    "type": "uint256",
                    "internalType": "uint256"
                }
            ]
        },
        {
            "type": "error",
            "name": "NotCanvasOwner",
            "inputs": [
                {
                    "name": "canvasId",
                    "type": "uint256",
                    "internalType": "uint256"
                },
                {
                    "name": "expected",
                    "type": "address",
                    "internalType": "address"
                }
            ]
        },
        {
            "type": "error",
            "name": "ReentrancyGuardReentrantCall",
            "inputs": []
        },
        {
            "type": "error",
            "name": "UnknownCanvas",
            "inputs": [
                {
                    "name": "canvasId",
                    "type": "uint256",
                    "internalType": "uint256"
                }
            ]
        }
    ]