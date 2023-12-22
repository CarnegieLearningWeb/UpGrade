<p align="center"><a href="https://www.upgradeplatform.org"><img src="assets/upgrade-logo.png" width="40px" alt="Upgrade - Open Source A/B Testing & Feature Flagging Tool" /><img src="assets/upgrade-logo-name.png" width="150px" alt="Upgrade - Open Source A/B Testing & Feature Flagging Tool" /></a></p>
<p align="center"><b>Open Source A/B Testing & Feature Flagging Tool</b></p>

<div align="center">
    <a href="https://github.com/CarnegieLearningWeb/UpGrade/github/actions/workflows/backend-build.yml"><img src="https://img.shields.io/github/actions/workflow/status/CarnegieLearningWeb/UpGrade/backend-build.yml?branch=dev" alt="Build Status" height="22"/></a>
    <a href="https://github.com/CarnegieLearningWeb/UpGrade/releases"><img src="https://img.shields.io/github/v/release/CarnegieLearningWeb/UpGrade?color=blue&sort=semver" alt="Release" height="22"/></a>
    <a href="https://github.com/CarnegieLearningWeb/UpGrade"><img src="https://img.shields.io/github/stars/CarnegieLearningWeb/UpGrade" alt="Stars Badge"/></a>
    <a href="https://github.com/CarnegieLearningWeb/UpGrade"><img src="https://img.shields.io/github/forks/CarnegieLearningWeb/UpGrade" alt="Forks Badge"/></a>
    <a href="https://github.com/CarnegieLearningWeb/UpGrade/pulls"><img src="https://img.shields.io/github/issues-pr/CarnegieLearningWeb/UpGrade" alt="Pull Requests Badge"/></a>
    <a href="https://github.com/CarnegieLearningWeb/UpGrade/issues"><img src="https://img.shields.io/github/issues/CarnegieLearningWeb/UpGrade" alt="Issues Badge"/></a>
    <a href="https://github.com/CarnegieLearningWeb/UpGrade/graphs/contributors"><img alt="GitHub contributors" src="https://img.shields.io/github/contributors/CarnegieLearningWeb/UpGrade?color=2b9348"></a>
    <a href="https://github.com/CarnegieLearningWeb/UpGrade/blob/dev/LICENSE"><img src="https://img.shields.io/github/license/CarnegieLearningWeb/UpGrade?color=2b9348" alt="License Badge"/></a>
    <a href="https://join.slack.com/t/upgrade-platform/shared_invite/zt-28mb077fn-_ZapZ_624EVRAdt5QOO7zA"><img src="https://img.shields.io/badge/slack-join-E01E5A?logo=slack" alt="Join us on Slack" height="22"/></a>
</div>

UpGrade is an open-source platform designed to support large-scale A/B testing in EdTech web applications. This combined repository provides tools and resources to integrate A/B testing frameworks into your client software. Learn more at www.upgradeplatform.org.

## Features

- 🆎 **A/B Testing**: Implement randomized field trials within EdTech software for impactful analysis of learning.
- 🏫 **Group Random Assignment**: Assign conditions by group such as school, teacher, or class.
- 🚩 **Feature Flagging**: Experiment-based feature flagging.
- 📊 **Segmentation**: Segmentation for inclusion/exclusion of participant groups.
- ➿ **Factorial Experiments**: Support for factorial experiment designs.
- ♊ **Stratified Random Sampling**: Sampling from subpopulations for proportional weighting.
- ⏫ **Scalability**: Designed to support large-scale experiments.
- 🔃 **Integration**: Easily integrates with EdTech applications.
- 💻 **SDKs**: We have SDKs for [Java](https://github.com/CarnegieLearningWeb/UpGrade/tree/dev/clientlibs/java), [Javascript](https://github.com/CarnegieLearningWeb/UpGrade/tree/dev/clientlibs/js) and [C#](https://github.com/CarnegieLearningWeb/UpGrade/pull/860). More to come soon!

    ![Java](https://img.shields.io/badge/java-%23ED8B00.svg?style=for-the-badge&logo=openjdk&logoColor=white) &nbsp;&nbsp; ![JavaScript](https://img.shields.io/badge/javascript-%23323330.svg?style=for-the-badge&logo=javascript&logoColor=%23F7DF1E) &nbsp;&nbsp; ![C#](https://img.shields.io/badge/c%23-%23239120.svg?style=for-the-badge&logo=c-sharp&logoColor=white)

https://github.com/CarnegieLearningWeb/UpGrade/assets/33730817/359c88c3-3020-46b9-b63b-f3160f827dff

## Documentation

Find detailed documentation for UpGrade at [UpGrade Documentation](https://upgrade-platform.gitbook.io/docs/).

## Quick Start (Using Docker)

##### Get `Upgrade` running using Nix:

Get started with UpGrade using Docker with this [Quick Start Guide](https://upgrade-platform.gitbook.io/docs/developer-guide/usage-guide) using Nix for separate containers for frontend, backend and postgres DB as separate containers.

<img src="https://img.shields.io/badge/Built_With-Nix-5277C3.svg?logo=nixos&labelColor=73C3D5" />

```markdown
Get NIX shell to delegate some dependency magic: 

$ sh <(curl -L https://nixos.org/nix/install)

Get the code from https://github.com/CarnegieLearningWeb/UpGrade (monorepo contains all packages):

$ git clone https://github.com/CarnegieLearningWeb/UpGrade.git

Navigate into root of project and run these commands to install dependencies:

$ cd Upgrade
$ make setup-local
```

<b>NOTE:</b> If this make command says nix not found and you are using zsh on mac, it may need to be manually added to PATH. OR, just try running it in bash

Then visit http://localhost:4200 and login using google id to view the Upgrade App.

<b>Dashboard</b>:

[![Upgrade Screenshot](assets/upgradeapp-dashboard.png)](https://www.upgradeplatform.org)

<b>Feature Flagging</b>:

[![Upgrade Screenshot 2](assets/feature-flag.png)](https://www.upgradeplatform.org)

## How to Contribute

Contributions are always welcome! If you're interested in improving UpGrade, please create a PR to add your Github Profile in the contributors list. Please refer the [Contributors](https://github.com/CarnegieLearningWeb/UpGrade/blob/dev/CONTRIBUTORS.md) file for the details of the trech stack we have used.

If you like this Repo, Please click the :star: !!!

## License

This project is licensed under the BSD-3-Clause License - see the [LICENSE](https://github.com/CarnegieLearningWeb/UpGrade/blob/main/LICENSE) file for details.

## Support

For an overview of the UpGrade platform, please visit [UpGrade Platform](https://www.upgradeplatform.org/).

## Acknowledgments

- Thanks to all the contributors who have helped build UpGrade.

#### Contributors:

<a href="https://github.com/VivekFitkariwala"><img src="https://avatars.githubusercontent.com/u/3822890?v=4" width="50" height="50" alt="VivekFitkariwala"/></a> <a href="https://github.com/JD2455"><img src="https://avatars.githubusercontent.com/u/46133795?v=4" width="50" height="50" alt="JD2455"/></a> <a href="https://github.com/ppratikcr7"><img src="https://avatars.githubusercontent.com/u/33730817?v=4" width="50" height="50" alt="ppratikcr7"/></a> <a href="https://github.com/danoswaltCL"><img src="https://avatars.githubusercontent.com/u/97542869?v=4" width="50" height="50" alt="danoswaltCL"/></a> <a href="https://github.com/mfugate1"><img src="https://avatars.githubusercontent.com/u/28930731?v=4" width="50" height="50" alt="mfugate1"/></a> <a href="https://github.com/PplJDHirapara"><img src="https://avatars.githubusercontent.com/u/61184300?v=4" width="50" height="50" alt="PplJDHirapara"/></a> <a href="https://github.com/RidhamShah"><img src="https://avatars.githubusercontent.com/u/49234788?v=4" width="50" height="50" alt="RidhamShah"/></a> <a href="https://github.com/msandbothe"><img src="https://avatars.githubusercontent.com/u/6402566?v=4" width="50" height="50" alt="msandbothe"/></a> <a href="https://github.com/YashilDepani"><img src="https://avatars.githubusercontent.com/u/51193749?v=4" width="50" height="50" alt="YashilDepani"/></a> <a href="https://github.com/PplTanmayJain"><img src="https://avatars.githubusercontent.com/u/86297930?v=4" width="50" height="50" alt="PplTanmayJain"/></a> <a href="https://github.com/jerith666"><img src="https://avatars.githubusercontent.com/u/854319?v=4" width="50" height="50" alt="jerith666"/></a> <a href="https://github.com/zackcl"><img src="https://avatars.githubusercontent.com/u/90279765?v=4" width="50" height="50" alt="zackcl"/></a>
<a href="https://github.com/Yagnik56"><img src="https://avatars.githubusercontent.com/u/50392803?v=4" width="50" height="50" alt="Yagnik56"/></a> <a href="https://github.com/jreddig"><img src="https://avatars.githubusercontent.com/u/97543136?v=4" width="50" height="50" alt="jreddig"/></a> <a href="https://github.com/nirmalpatel"><img src="https://avatars.githubusercontent.com/u/830400?v=4" width="50" height="50" alt="nirmalpatel"/></a> <a href="https://github.com/kawcl"><img src="https://avatars.githubusercontent.com/u/91336571?v=4" width="50" height="50" alt="kawcl"/></a> <a href="https://github.com/dhavalocked"><img src="https://avatars.githubusercontent.com/u/7206634?v=4" width="50" height="50" alt="dhavalocked"/></a> <a href="https://github.com/tanmayjain3"><img src="https://avatars.githubusercontent.com/u/17405612?v=4" width="50" height="50" alt="tanmayjain3"/></a> <a href="https://github.com/amurphy-cl"><img src="https://avatars.githubusercontent.com/u/65311369?v=4" width="50" height="50" alt="amurphy-cl"/></a> <a href="https://github.com/mhglover"><img src="https://avatars.githubusercontent.com/u/662095?v=4" width="50" height="50" alt="mhglover"/></a> <a href="https://github.com/bcb37"><img src="https://avatars.githubusercontent.com/u/3885687?v=4" width="50" height="50" alt="bcb37"/></a> <a href="https://github.com/ldunne-cl"><img src="https://avatars.githubusercontent.com/u/127241408?v=4" width="50" height="50" alt="ldunne-cl"/></a> <a href="https://github.com/mswartzCL"><img src="https://avatars.githubusercontent.com/u/105314488?v=4" width="50" height="50" alt="mswartzCL"/></a> <a href="https://github.com/telfekycl"><img src="https://avatars.githubusercontent.com/u/118201614?v=4" width="50" height="50" alt="telfekycl"/></a> <a href="https://github.com/SritterCL"><img src="https://avatars.githubusercontent.com/u/16547537?v=4" width="50" height="50" alt="SritterCL"/></a>  
---

For more information, please refer to the [official repository](https://github.com/CarnegieLearningWeb/UpGrade) of UpGrade.

---

![Built with Science](http://ForTheBadge.com/images/badges/built-with-science.svg)
