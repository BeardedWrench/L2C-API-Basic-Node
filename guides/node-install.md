# Node Installation


## MACOS
To install node, we're going to be using [Homebrew](https://brew.sh/)

If you don't currently have brew installed please run the following command in your terminal:
`curl -o- https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh | bash`

Once Brew has finished installing, run:
`brew install node@24.4.0`

Verify your install was successful via:
`node -v` - Should print "v24.4.0"
`npm -v` - Should print "11.4.2" or the latest.