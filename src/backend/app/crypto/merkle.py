import hashlib
from typing import List, Tuple, Dict, Any

class MerkleTree:
    """
    Standard binary SHA-256 Merkle Tree implementation for batching clinical records.
    Provides inclusion proofs for verifying tamper-proofing.
    """
    def __init__(self, leaf_hashes: List[str]):
        if not leaf_hashes:
            raise ValueError("Leaf hashes list cannot be empty")
        self.leaf_hashes = leaf_hashes
        self.levels = [leaf_hashes]
        self._build_tree()

    def _hash_pair(self, left: str, right: str) -> str:
        combined = (left + right).encode('utf-8')
        return hashlib.sha256(combined).hexdigest()

    def _build_tree(self):
        current = self.leaf_hashes
        while len(current) > 1:
            next_level = []
            for i in range(0, len(current), 2):
                left = current[i]
                right = current[i + 1] if i + 1 < len(current) else left
                next_level.append(self._hash_pair(left, right))
            self.levels.append(next_level)
            current = next_level

    @property
    def root(self) -> str:
        return self.levels[-1][0]

    def get_proof(self, index: int) -> List[Dict[str, str]]:
        """
        Generates inclusion audit path (proof) for leaf at given index.
        """
        proof = []
        for level in self.levels[:-1]:
            is_right_child = (index % 2 == 1)
            sibling_index = index - 1 if is_right_child else index + 1
            if sibling_index < len(level):
                sibling_hash = level[sibling_index]
            else:
                sibling_hash = level[index] # duplicate if odd
            proof.append({
                "position": "left" if is_right_child else "right",
                "hash": sibling_hash
            })
            index = index // 2
        return proof

    @staticmethod
    def verify_proof(leaf_hash: str, proof: List[Dict[str, str]], expected_root: str) -> bool:
        """
        Verifies if leaf_hash combined with proof produces expected_root.
        """
        current_hash = leaf_hash
        for step in proof:
            sibling = step["hash"]
            if step["position"] == "left":
                combined = (sibling + current_hash).encode('utf-8')
            else:
                combined = (current_hash + sibling).encode('utf-8')
            current_hash = hashlib.sha256(combined).hexdigest()
        return current_hash == expected_root
