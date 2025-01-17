import {
  MoocletBatchResponse,
  MoocletPolicyParametersRequestBody,
  MoocletPolicyParametersResponseDetails,
  MoocletPolicyResponseDetails,
  MoocletProxyRequestParams,
  MoocletRequestBody,
  MoocletResponseDetails,
  MoocletVariableRequestBody,
  MoocletVariableResponseDetails,
  MoocletVersionRequestBody,
  MoocletVersionResponseDetails,
} from '../../../src/types/Mooclet';
import { MoocletDataService } from '../../../src/api/services/MoocletDataService';
import { Container } from 'typedi';
import axios from 'axios';
import { UpgradeLogger } from '../../../src/lib/logger/UpgradeLogger';
import { ASSIGNMENT_ALGORITHM } from '../../../../../../types/src';
import { MoocletTSConfigurablePolicyParametersDTO } from 'upgrade_types';

jest.mock('axios');

describe('#MoocletDataService', () => {
  let moocletDataService: MoocletDataService;

  beforeAll(() => {
    moocletDataService = Container.get(MoocletDataService);
  });

  afterAll(() => {
    Container.reset();
  });

  describe('#getMoocletIdByName', () => {
    it('should return the correct Mooclet ID when the policy name matches', async () => {
      const mockPoliciesList: MoocletBatchResponse<MoocletPolicyResponseDetails> = {
        count: 2,
        next: null,
        previous: null,
        results: [
          { id: 1, name: 'Policy1' },
          { id: 2, name: 'Policy2' },
        ],
      };

      jest.spyOn(moocletDataService, 'getPoliciesList').mockResolvedValue(mockPoliciesList);

      const moocletId = await moocletDataService.getMoocletIdByName('Policy2');
      expect(moocletId).toBe(2);
    });

    it('should return null when the policy name does not match', async () => {
      const mockPoliciesList: MoocletBatchResponse<MoocletPolicyResponseDetails> = {
        count: 2,
        next: null,
        previous: null,
        results: [
          { id: 1, name: 'Policy1' },
          { id: 2, name: 'Policy2' },
        ],
      };

      jest.spyOn(moocletDataService, 'getPoliciesList').mockResolvedValue(mockPoliciesList);

      const moocletId = await moocletDataService.getMoocletIdByName('Policy3');
      expect(moocletId).toBeNull();
    });

    it('should return null when the policies list is empty', async () => {
      const mockPoliciesList: MoocletBatchResponse<MoocletPolicyResponseDetails> = {
        count: 0,
        next: null,
        previous: null,
        results: [],
      };

      jest.spyOn(moocletDataService, 'getPoliciesList').mockResolvedValue(mockPoliciesList);

      const moocletId = await moocletDataService.getMoocletIdByName('Policy1');
      expect(moocletId).toBeNull();
    });

    it('should throw an error when getPoliciesList fails', async () => {
      jest.spyOn(moocletDataService, 'getPoliciesList').mockRejectedValue(new Error('Failed to fetch policies'));

      await expect(moocletDataService.getMoocletIdByName('Policy1')).rejects.toThrow('Failed to fetch policies');
    });

    afterAll(() => {
      jest.restoreAllMocks();
    });
  });

  describe('#getPoliciesList', () => {
    it('should return the list of policies', async () => {
      const mockPoliciesList: MoocletBatchResponse<MoocletPolicyResponseDetails> = {
        count: 2,
        next: null,
        previous: null,
        results: [
          { id: 1, name: 'Policy1' },
          { id: 2, name: 'Policy2' },
        ],
      };

      jest.spyOn(moocletDataService, 'fetchExternalMoocletsData').mockResolvedValue(mockPoliciesList);

      const policiesList = await moocletDataService.getPoliciesList();
      expect(policiesList).toEqual(mockPoliciesList);
    });

    it('should throw an error when fetchExternalMoocletsData fails', async () => {
      jest
        .spyOn(moocletDataService, 'fetchExternalMoocletsData')
        .mockRejectedValue(new Error('Failed to fetch policies'));

      await expect(moocletDataService.getPoliciesList()).rejects.toThrow('Failed to fetch policies');
    });
  });

  describe('#postNewMooclet', () => {
    it('should return the new Mooclet details when the request is successful', async () => {
      const mockRequestBody: MoocletRequestBody = {
        name: 'New Mooclet',
        policy: 3,
      };

      const mockResponseDetails: MoocletResponseDetails = {
        id: 1,
        name: 'New Mooclet',
        policy: 3,
      };

      jest.spyOn(moocletDataService, 'fetchExternalMoocletsData').mockResolvedValue(mockResponseDetails);

      const response = await moocletDataService.postNewMooclet(mockRequestBody);
      expect(response).toEqual(mockResponseDetails);
    });

    it('should throw an error when the request fails', async () => {
      const mockRequestBody: MoocletRequestBody = {
        name: 'New Mooclet',
        policy: 3,
      };

      jest
        .spyOn(moocletDataService, 'fetchExternalMoocletsData')
        .mockRejectedValue(new Error('Failed to create mooclet'));

      await expect(moocletDataService.postNewMooclet(mockRequestBody)).rejects.toThrow('Failed to create mooclet');
    });
  });

  describe('#deleteMooclet', () => {
    it('should return the response when the delete request is successful', async () => {
      const moocletId = 1;
      const mockResponse = { success: true };

      jest.spyOn(moocletDataService, 'fetchExternalMoocletsData').mockResolvedValue(mockResponse);

      const response = await moocletDataService.deleteMooclet(moocletId);
      expect(response).toEqual(mockResponse);
    });

    it('should throw an error when the delete request fails', async () => {
      const moocletId = 1;

      jest
        .spyOn(moocletDataService, 'fetchExternalMoocletsData')
        .mockRejectedValue(new Error('Failed to delete mooclet'));

      await expect(moocletDataService.deleteMooclet(moocletId)).rejects.toThrow('Failed to delete mooclet');
    });
  });

  describe('#postNewVersion', () => {
    it('should return the new version details when the request is successful', async () => {
      const mockRequestBody: MoocletVersionRequestBody = {
        mooclet: 1,
        name: 'Version 1',
        text: 'This is version 1',
        version_json: { key: 1 },
      };

      const mockResponseDetails: MoocletVersionResponseDetails = {
        id: 1,
        mooclet: 1,
        name: 'Version 1',
        text: 'This is version 1',
        version_json: { key: 1 },
      };

      jest.spyOn(moocletDataService, 'fetchExternalMoocletsData').mockResolvedValue(mockResponseDetails);

      const response = await moocletDataService.postNewVersion(mockRequestBody);
      expect(response).toEqual(mockResponseDetails);
    });

    it('should throw an error when the request fails', async () => {
      const mockRequestBody: MoocletVersionRequestBody = {
        mooclet: 1,
        name: 'Version 1',
        text: 'This is version 1',
        version_json: { key: 1 },
      };

      jest
        .spyOn(moocletDataService, 'fetchExternalMoocletsData')
        .mockRejectedValue(new Error('Failed to create version'));

      await expect(moocletDataService.postNewVersion(mockRequestBody)).rejects.toThrow('Failed to create version');
    });
  });

  describe('#deleteVersion', () => {
    it('should return the response when the delete request is successful', async () => {
      const versionId = 1;
      const mockResponse = { success: true };

      jest.spyOn(moocletDataService, 'fetchExternalMoocletsData').mockResolvedValue(mockResponse);

      const response = await moocletDataService.deleteVersion(versionId);
      expect(response).toEqual(mockResponse);
    });

    it('should throw an error when the delete request fails', async () => {
      const versionId = 1;

      jest
        .spyOn(moocletDataService, 'fetchExternalMoocletsData')
        .mockRejectedValue(new Error('Failed to delete version'));

      await expect(moocletDataService.deleteVersion(versionId)).rejects.toThrow('Failed to delete version');
    });
  });

  describe('#postNewPolicyParameters', () => {
    const mockPolicyParameters: MoocletTSConfigurablePolicyParametersDTO = {
      prior: {
        failure: 1,
        success: 1,
      },
      batch_size: 1,
      max_rating: 1,
      min_rating: 0,
      uniform_threshold: 0,
      tspostdiff_thresh: 0,
      outcome_variable_name: 'example_reward_var',
      assignmentAlgorithm: ASSIGNMENT_ALGORITHM.MOOCLET_TS_CONFIGURABLE,
    };
    it('should return the new policy parameters details when the request is successful', async () => {
      const mockRequestBody: MoocletPolicyParametersRequestBody = {
        mooclet: 1,
        policy: 2,
        parameters: {
          ...mockPolicyParameters,
          assignmentAlgorithm: ASSIGNMENT_ALGORITHM.MOOCLET_TS_CONFIGURABLE,
        },
      };

      const mockResponseDetails: MoocletPolicyParametersResponseDetails = {
        id: 1,
        mooclet: 1,
        policy: 2,
        parameters: {
          ...mockPolicyParameters,
          assignmentAlgorithm: ASSIGNMENT_ALGORITHM.MOOCLET_TS_CONFIGURABLE,
        },
      };

      jest.spyOn(moocletDataService, 'fetchExternalMoocletsData').mockResolvedValue(mockResponseDetails);

      const response = await moocletDataService.postNewPolicyParameters(mockRequestBody);
      expect(response).toEqual(mockResponseDetails);
    });

    it('should throw an error when the request fails', async () => {
      const mockRequestBody: MoocletPolicyParametersRequestBody = {
        mooclet: 1,
        policy: 2,
        parameters: {
          ...mockPolicyParameters,
          assignmentAlgorithm: ASSIGNMENT_ALGORITHM.MOOCLET_TS_CONFIGURABLE,
        },
      };

      jest
        .spyOn(moocletDataService, 'fetchExternalMoocletsData')
        .mockRejectedValue(new Error('Failed to create policy parameters'));

      await expect(moocletDataService.postNewPolicyParameters(mockRequestBody)).rejects.toThrow(
        'Failed to create policy parameters'
      );
    });
  });

  describe('#deletePolicyParameters', () => {
    it('should return the response when the delete request is successful', async () => {
      const policyParametersId = 1;
      const mockResponse = { success: true };

      jest.spyOn(moocletDataService, 'fetchExternalMoocletsData').mockResolvedValue(mockResponse);

      const response = await moocletDataService.deletePolicyParameters(policyParametersId);
      expect(response).toEqual(mockResponse);
    });

    it('should throw an error when the delete request fails', async () => {
      const policyParametersId = 1;

      jest
        .spyOn(moocletDataService, 'fetchExternalMoocletsData')
        .mockRejectedValue(new Error('Failed to delete policy parameters'));

      await expect(moocletDataService.deletePolicyParameters(policyParametersId)).rejects.toThrow(
        'Failed to delete policy parameters'
      );
    });
  });

  describe('#postNewVariable', () => {
    it('should return the new variable details when the request is successful', async () => {
      const mockRequestBody: MoocletVariableRequestBody = {
        name: 'New Variable',
      };

      const mockResponseDetails: MoocletVariableResponseDetails = {
        id: 1,
        environment: null,
        variable_id: null,
        name: 'New Variable',
        min_value: 0,
        max_value: 1,
        value_type: 'BIN',
        sample_thres: 1,
      };

      jest.spyOn(moocletDataService, 'fetchExternalMoocletsData').mockResolvedValue(mockResponseDetails);

      const response = await moocletDataService.postNewVariable(mockRequestBody);
      expect(response).toEqual(mockResponseDetails);
    });

    it('should throw an error when the request fails', async () => {
      const mockRequestBody: MoocletVariableRequestBody = {
        name: 'New Variable',
      };

      jest
        .spyOn(moocletDataService, 'fetchExternalMoocletsData')
        .mockRejectedValue(new Error('Failed to create variable'));

      await expect(moocletDataService.postNewVariable(mockRequestBody)).rejects.toThrow('Failed to create variable');
    });
  });

  describe('#deleteVariable', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should return the response when the delete request is successful', async () => {
      const variableId = 1;
      const mockResponse = { success: true };

      jest.spyOn(moocletDataService, 'fetchExternalMoocletsData').mockResolvedValue(mockResponse);

      const response = await moocletDataService.deleteVariable(variableId);
      expect(response).toEqual(mockResponse);
    });

    it('should throw an error when the delete request fails', async () => {
      const variableId = 1;

      jest
        .spyOn(moocletDataService, 'fetchExternalMoocletsData')
        .mockRejectedValue(new Error('Failed to delete variable'));

      await expect(moocletDataService.deleteVariable(variableId)).rejects.toThrow('Failed to delete variable');
    });

    afterAll(() => {
      jest.restoreAllMocks();
    });
  });

  describe('#fetchExternalMoocletsData', () => {
    const mockRequest: MoocletRequestBody = {
      name: 'New Mooclet',
      policy: 3,
    };
    it('should return the response data when the request is successful', async () => {
      const mockRequestParams: MoocletProxyRequestParams = {
        method: 'POST',
        url: 'https://api.example.com/mooclet',
        apiToken: 'test-token',
        body: { ...mockRequest },
      };

      const mockResponse = {
        status: 200,
        data: { success: true },
      };

      (axios.request as jest.Mock).mockResolvedValue(mockResponse);

      const response = await moocletDataService.fetchExternalMoocletsData(mockRequestParams);
      expect(response).toEqual(mockResponse.data);
    });

    it('should return an error object when the request fails with a non-2xx status', async () => {
      const mockRequestParams: MoocletProxyRequestParams = {
        method: 'POST',
        url: 'https://api.example.com/mooclet',
        apiToken: 'test-token',
        body: { ...mockRequest },
      };

      const mockErrorResponse = {
        status: 400,
        data: { error: 'Bad Request' },
      };

      (axios.request as jest.Mock).mockResolvedValue(mockErrorResponse);

      const response = await moocletDataService.fetchExternalMoocletsData(mockRequestParams);
      expect(response).toEqual({ error: mockErrorResponse });
    });

    it('should log an error and return undefined when the request throws an error', async () => {
      const mockRequestParams: MoocletProxyRequestParams = {
        method: 'POST',
        url: 'https://api.example.com/mooclet',
        apiToken: 'test-token',
        body: { ...mockRequest },
      };

      const mockError = new Error('Mock Network Error');
      const loggerSpy = jest.spyOn(UpgradeLogger.prototype, 'error');

      (axios.request as jest.Mock).mockRejectedValue(mockError);

      const response = await moocletDataService.fetchExternalMoocletsData(mockRequestParams);
      expect(response).toBeUndefined();
      expect(loggerSpy).toHaveBeenCalledWith({ message: `Error fetching data from Mooclets API: ${mockError}` });
    });
  });
});
