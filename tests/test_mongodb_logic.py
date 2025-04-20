import pytest
from unittest.mock import MagicMock
from pymongo.collection import Collection

@pytest.mark.asyncio
async def test_mongodb_insert_update_logic():
    # Mock MongoDB collection
    mock_collection = MagicMock(spec=Collection)

    # Test insert logic
    mock_collection.insert_one.return_value = {"acknowledged": True, "inserted_id": "12345"}
    result = mock_collection.insert_one({"name": "John Doe"})
    assert result["acknowledged"], "Insert operation failed"
    assert result["inserted_id"] == "12345", "Insert operation returned incorrect ID"

    # Test update logic
    mock_collection.update_one.return_value = {"acknowledged": True, "modified_count": 1}
    result = mock_collection.update_one({"name": "John Doe"}, {"$set": {"age": 30}})
    assert result["acknowledged"], "Update operation failed"
    assert result["modified_count"] == 1, "Update operation did not modify the document"