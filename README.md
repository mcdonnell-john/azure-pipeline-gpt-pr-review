# OpenAI GPT Pull Request Reviewer for Azure Devops
A task for Azure DevOps build pipelines to add OpenAI as PR Reviewer
This extension is based on https://github.com/mlarhrouch/azure-pipeline-gpt-pr-review 

## Installation

Installation can be done using [Visual Studio MarketPlace](https://marketplace.visualstudio.com/items?itemName=mcdonnell-john.OpenAIPRReviewer).

## Usage

Add the tasks to your build definition.

## Setup

### Give permission to the build service agent

before use this task, make sure that the build service has permissions to contribute to pull requests in your repository :

![contribute_to_pr](https://github.com/mcdonnell-john/azure-pipeline-gpt-pr-review/blob/main/images/contribute_to_pr.png?raw=true)

### Allow Task to access the system token

#### Yaml pipelines 

Add a checkout section with persistCredentials set to true.

```yaml
steps:
- checkout: self
  persistCredentials: true
```

#### Classic editors 

Enable the option "Allow scripts to access the OAuth token" in the "Agent job" properties :

![allow_access_token](https://github.com/mcdonnell-john/azure-pipeline-gpt-pr-review/blob/main/images/allow_access_token.png?raw=true)

### Azure OpenAI service

If you choose to use the Azure OpenAI service, you must fill in the endpoint and API key of Azure OpenAI. The format of the endpoint is as follows: https://{XXXXXXXX}.openai.azure.com/openai/deployments/{MODEL_NAME}/chat/completions?api-version={API_VERSION}


### OpenAI Models

In case you don't use Azure OpenAI Service, you can choose which model to use, the supported models are "gpt-4o", "gpt-4", "gpt-3.5-turbo" and "gpt-3.5-turbo-16k". if no model is selected the "gpt-4o" is used.

## Contributions

Found and fixed a bug or improved on something? Contributions are welcome! Please target your pull request against the `main` branch or report an issue on [GitHub](https://github.com/mcdonnell-john/azure-pipeline-gpt-pr-review/issues) so someone else can try and implement or fix it.

## License
This project is licensed under the [MIT License](https://raw.githubusercontent.com/mcdonnell-john/azure-pipeline-gpt-pr-review/main/LICENSE), in accordance with the original project license.