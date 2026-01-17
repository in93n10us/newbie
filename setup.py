from setuptools import setup, find_packages
import os

# Read requirements from requirements.txt
with open('requirements.txt') as f:
    required = f.read().splitlines()

# Read the README for the long description
with open('README.md', 'r', encoding='utf-8') as f:
    long_description = f.read()

setup(
    name="sentinelai",
    version="1.0.0",
    author="Robo Romeski",
    author_email="robo@sentinelai.com",
    description="Real-Time Anti-Cheat Detection System for Online Games",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/sentinelai/sentinelai",
    packages=find_packages(exclude=["tests*"]),
    classifiers=[
        "Development Status :: 4 - Beta",
        "Intended Audience :: Developers",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Topic :: Games/Entertainment",
        "Topic :: Security",
        "Topic :: Software Development :: Libraries :: Python Modules",
    ],
    python_requires=">=3.8",
    install_requires=required,
    extras_require={
        'dev': [
            'pytest>=7.0.0',
            'pytest-cov>=3.0.0',
            'black>=22.0.0',
            'flake8>=4.0.0',
            'mypy>=0.900',
            'pre-commit>=2.17.0',
        ],
    },
    entry_points={
        'console_scripts': [
            'sentinelai=sentinelai.cli:main',
        ],
    },
    package_data={
        'sentinelai': ['py.typed'],
    },
    include_package_data=True,
    zip_safe=False,
)