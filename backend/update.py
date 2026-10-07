"""Keep legacy launchers compatible without checking or installing updates."""

import argparse


def main() -> None:
    parser = argparse.ArgumentParser(description="本整合包由用户自行维护，更新已禁用。")
    parser.add_argument("mode", choices=["auto", "check", "apply"])
    parser.parse_args()
    print("更新已禁用：本整合包由用户自行维护，不再检查、下载或安装代码更新。")


if __name__ == "__main__":
    main()
