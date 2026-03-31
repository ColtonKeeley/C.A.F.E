from abc import ABC, abstractmethod
import os

import tkinter as tk
from tkinter import filedialog, messagebox
import os



class BaseVisor(ABC):
    def __init__(self, source_path):
        self.source_path = os.path.abspath(source_path)
        self.base_dir = os.path.dirname(self.source_path)
        self.name = "Base Visor"

    @abstractmethod
    def render(self, output_path):
        """Must be implemented by child (e.g. EmailVisor, PDFVisor)"""
        pass

    @abstractmethod
    def get_labels(self):
        """Extract ground-truth labels from the raw source"""
        pass

    @abstractmethod
    def run(self):
        pass

    def save_metadata(self, data):
        """A common utility for all visors"""
        print(f"Saving metadata to {self.base_dir}")
        # common saving logic here


